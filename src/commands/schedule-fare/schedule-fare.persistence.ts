import {
  chain as taskEitherChain,
  fromEither,
  map as taskEitherMap,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { FaresToSchedulePersist } from './schedule-fare.route';
import { onDatabaseError, throwEntityNotFoundValidationError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, toScheduledPersistence } from '../../mappers';
import { Either } from 'fp-ts/Either';

import { insertPendingReturnRelatedToScheduled, insertScheduledFareQuery } from '../_common/shared-queries.persistence';

export const persistScheduledFares =
  (database: PostgresDb) =>
  (fares: Either<Errors, FaresToSchedulePersist>): TaskEither<Errors, unknown> =>
    pipe(fares, fromEither, taskEitherChain(insertIn(database)));

const insertIn =
  (database: PostgresDb) =>
  (fares: FaresToSchedulePersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistScheduledFares`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, pendingToCreate }: FaresToSchedulePersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const scheduledCreatedQueryResult: QueryResult = await insertScheduledFareQuery(client)(
        toScheduledPersistence(scheduledToCreate)
      );

      if (scheduledCreatedQueryResult.rows[0] === undefined) throwEntityNotFoundValidationError('undefinedId');

      const queriesResults: QueryResult[] = [scheduledCreatedQueryResult];

      if (pendingToCreate !== undefined) {
        queriesResults.push(await insertPendingReturnRelatedToScheduled(client)(scheduledCreatedQueryResult, pendingToCreate));
      }

      return queriesResults;
    });

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingCreated: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0]
});
