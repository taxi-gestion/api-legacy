import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Entity } from '../../definitions';
import { FaresToDelete } from './delete-fare.route';
import { onDatabaseError } from '../../errors';
import { pipe } from 'fp-ts/lib/function';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, fromDBtoUnassignedCandidate } from '../../mappers';
import { deleteFareEntityQuery } from '../_common/shared-queries.persistence';

export const persistDeleteFares =
  (database: PostgresDb) =>
  (fares: FaresToDelete): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError('deleteFares')), taskEitherMap(toTransfer));

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToDelete, pendingToDelete, unassignedToDelete }: FaresToDelete) =>
  async (): Promise<(QueryResult | undefined)[]> =>
    database.transact(
      async (client: PoolClient): Promise<(QueryResult | undefined)[]> =>
        Promise.all([
          queryOrEmpty(client, 'scheduled_fares')(scheduledToDelete),
          queryOrEmpty(client, 'pending_returns')(pendingToDelete),
          queryOrEmpty(client, 'unassigned_fares')(unassignedToDelete)
        ])
    );

const queryOrEmpty =
  (client: PoolClient, tableName: string) =>
  async (entity: Entity | undefined): Promise<QueryResult | undefined> =>
    entity === undefined ? undefined : deleteFareEntityQuery(client, tableName)(entity);

const toTransfer = (queriesResults: (QueryResult | undefined)[]): unknown => ({
  scheduledDeleted:
    queriesResults[0] === undefined ? undefined : [queriesResults[0].rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingDeleted: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0],
  unassignedDeleted:
    queriesResults[2] === undefined ? undefined : [queriesResults[2].rows[0]].map(fromDBtoUnassignedCandidate)[0]
});
