import { TaskEither, tryCatch as taskEitherTryCatch, map as taskEitherMap } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter/http-reporter';
import { Entity } from '../../definitions';
import { FaresToDelete } from './delete-fare.route';
import { onDatabaseError } from '../../reporter/database.error';
import { pipe } from 'fp-ts/lib/function';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate } from '../../persistence/persistence-utils';

export const persistDeleteFares =
  (database: PostgresDb) =>
  ({ scheduledToDelete, pendingToDelete }: FaresToDelete): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(
        async (): Promise<QueryResult[]> =>
          database.transact(
            async (client: PoolClient): Promise<QueryResult[]> =>
              Promise.all([
                deleteScheduledFareQuery(client, scheduledToDelete),
                ...removePendingReturnQueryOrEmpty(client, pendingToDelete)
              ])
          ),
        onDatabaseError('deleteFares')
      ),
      taskEitherMap(toFareDeletedCandidate)
    );

const removePendingReturnQueryOrEmpty = (client: PoolClient, returnToDelete: Entity | undefined): [] | [Promise<QueryResult>] =>
  returnToDelete === undefined ? [] : [removePendingReturnQuery(client, returnToDelete)];

const deleteScheduledFareQuery = async (client: PoolClient, farePg: Entity): Promise<QueryResult> =>
  client.query(deleteScheduledFareQueryString, [farePg.id]);

const deleteScheduledFareQueryString: string = `
      DELETE FROM scheduled_fares WHERE id = $1 RETURNING *
      `;

const removePendingReturnQuery = async (client: PoolClient, returnToDelete: Entity): Promise<QueryResult> =>
  client.query(removePendingReturnQueryString, [returnToDelete.id]);

const removePendingReturnQueryString: string = `
  DELETE FROM pending_returns WHERE id = $1 RETURNING *
`;

const toFareDeletedCandidate = (queriesResults: QueryResult[]): unknown => ({
  scheduledDeleted: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[1] === undefined ? {} : { pendingDeleted: [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
