import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Entity } from '../../definitions';
import { FaresToDelete } from './delete-fare.route';
import { onDatabaseError } from '../../errors';
import { pipe } from 'fp-ts/lib/function';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate } from '../../mappers';

export const persistDeleteFares =
  (database: PostgresDb) =>
  (fares: FaresToDelete): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError('deleteFares')), taskEitherMap(toTransfer));

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToDelete, pendingToDelete }: FaresToDelete) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([
          deleteScheduledFareQuery(client)(scheduledToDelete),
          ...removePendingReturnQueryOrEmpty(client)(pendingToDelete)
        ])
    );

const removePendingReturnQueryOrEmpty =
  (client: PoolClient) =>
  (returnToDelete: Entity | undefined): [] | [Promise<QueryResult>] =>
    returnToDelete === undefined ? [] : [removePendingReturnQuery(client)(returnToDelete)];

const deleteScheduledFareQuery =
  (client: PoolClient) =>
  async (farePg: Entity): Promise<QueryResult> =>
    client.query(deleteScheduledFareQueryString, [farePg.id]);

const deleteScheduledFareQueryString: string = `
      DELETE FROM scheduled_fares WHERE id = $1 RETURNING *
      `;

const removePendingReturnQuery =
  (client: PoolClient) =>
  async (returnToDelete: Entity): Promise<QueryResult> =>
    client.query(removePendingReturnQueryString, [returnToDelete.id]);

const removePendingReturnQueryString: string = `
  DELETE FROM pending_returns WHERE id = $1 RETURNING *
`;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledDeleted: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[1] === undefined ? {} : { pendingDeleted: [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
