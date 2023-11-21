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
import { Errors } from '../../codecs';
import { onDatabaseError, throwEntityNotFoundValidationError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, toScheduledPersistence } from '../../mappers';
import { Either } from 'fp-ts/Either';

import { insertPendingReturnRelatedToScheduled } from '../_common/insert-pending-return-related-to-scheduled.persistence';
import { insertScheduledFareQuery } from '../_common/insert-scheduled-fare.persistence';
import { ScheduledAndPendingPersist, ScheduledPersist } from './schedule-fare.route';
import { ScheduledAndReturnPersist } from '../apply-recurring-for-date/apply-recurring-for-date.route';

export const persistScheduledFaresFP =
  (database: PostgresDb) =>
  (fares: Either<Errors, ScheduledAndPendingPersist | ScheduledPersist>): TaskEither<Errors, unknown> =>
    pipe(fares, fromEither, taskEitherChain(insertScheduledAndOptionalPersistIn(database)));

// TODO Refactor into separate functions for each case
export const insertScheduledAndOptionalPersistIn =
  (database: PostgresDb) =>
  (fares: ScheduledAndPendingPersist | ScheduledPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistScheduledFares`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, pendingToCreate }: ScheduledAndPendingPersist | ScheduledPersist) =>
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

export const insertScheduledAndReturnPersistIn =
  (database: PostgresDb) =>
  (fares: ScheduledAndReturnPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyScheduledAndScheduledReturnQueries(database)(fares), onDatabaseError(`persistScheduledFares`)),
      taskEitherMap(toScheduledAndScheduledReturnTransfer)
    );

export const applyScheduledAndScheduledReturnQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, scheduledReturnToCreate }: ScheduledAndReturnPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([
          insertScheduledFareQuery(client)(toScheduledPersistence(scheduledToCreate)),
          insertScheduledFareQuery(client)(toScheduledPersistence(scheduledReturnToCreate))
        ])
    );

export const toScheduledAndScheduledReturnTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  scheduledReturnCreated: [queriesResults[1]?.rows[0]].map(fromDBtoScheduledCandidate)[0]
});
