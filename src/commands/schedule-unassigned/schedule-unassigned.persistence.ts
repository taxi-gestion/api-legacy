import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { UnassignedToSchedulePersist } from './schedule-unassigned.route';
import { pipe } from 'fp-ts/function';
import { onDatabaseError, throwEntityNotFoundValidationError } from '../../errors';
import {
  fromDBtoUnassignedCandidate,
  fromDBtoScheduledCandidate,
  fromDBtoPendingCandidate,
  toScheduledPersistence
} from '../../mappers';
import {
  deleteFareEntityQuery,
  insertPendingReturnRelatedToScheduled,
  insertScheduledFareQuery
} from '../_common/shared-queries.persistence';

export const persistUnassignedScheduled =
  (database: PostgresDb) =>
  (fares: UnassignedToSchedulePersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistUnassignedScheduled`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, unassignedToDelete, pendingToCreate }: UnassignedToSchedulePersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const [scheduledCreatedQueryResult, deleteUnassignedQueryResult]: QueryResult[] = await Promise.all([
        insertScheduledFareQuery(client)(toScheduledPersistence(scheduledToCreate)),
        deleteFareEntityQuery(client, 'unassigned_fares')(unassignedToDelete)
      ]);

      if (!isQueryResult(scheduledCreatedQueryResult) || !isQueryResult(deleteUnassignedQueryResult))
        return throwEntityNotFoundValidationError('undefinedId');

      const queriesResults: QueryResult[] = [scheduledCreatedQueryResult, deleteUnassignedQueryResult];

      if (pendingToCreate !== undefined) {
        queriesResults.push(await insertPendingReturnRelatedToScheduled(client)(scheduledCreatedQueryResult, pendingToCreate));
      }

      return queriesResults;
    });

const isQueryResult = (element: QueryResult | undefined): element is QueryResult => element?.rows[0] !== undefined;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  unassignedDeleted: [queriesResults[1]?.rows[0]].map(fromDBtoUnassignedCandidate)[0],
  ...(queriesResults[2] === undefined ? {} : { pendingCreated: [queriesResults[2].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
