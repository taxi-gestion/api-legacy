import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { PendingToSchedulePersist } from './schedule-pending.route';
import { pipe } from 'fp-ts/function';
import { onDatabaseError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, toScheduledPersistence } from '../../mappers';
import { deletePendingReturnQuery } from '../_common/delete-pending-return.persistence';
import { insertScheduledFareQuery } from '../_common/insert-scheduled-fare.persistence';

export const persistPendingScheduled =
  (database: PostgresDb) =>
  (fares: PendingToSchedulePersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistPendingScheduled`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, pendingToDelete }: PendingToSchedulePersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([
          insertScheduledFareQuery(client)(toScheduledPersistence(scheduledToCreate)),
          deletePendingReturnQuery(client)(pendingToDelete)
        ])
    );

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[1] === undefined ? {} : { pendingDeleted: [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
