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
import { RecurringPersistence } from '../../definitions';
import { onDatabaseError } from '../../errors';
import { fromDBtoRecurringCandidate, toRecurringPersistence } from '../../mappers';
import { Either } from 'fp-ts/Either';
import { RecurringToAddPersist } from './add-recurring.route';

export const persistRecurring =
  (database: PostgresDb) =>
  (fares: Either<Errors, RecurringToAddPersist>): TaskEither<Errors, unknown> =>
    pipe(fares, fromEither, taskEitherChain(insertIn(database)));

const insertIn =
  (database: PostgresDb) =>
  (fare: RecurringToAddPersist): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(insertRecurring(database)(fare), onDatabaseError(`persistRecurring`)), taskEitherMap(toTransfer));

const insertRecurring =
  (database: PostgresDb) =>
  ({ recurringToCreate }: RecurringToAddPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([insertRecurringFareQuery(client)(toRecurringPersistence(recurringToCreate))])
    );

const insertRecurringFareQuery =
  (client: PoolClient) =>
  async (farePg: RecurringPersistence): Promise<QueryResult> =>
    client.query(insertRecurringFareQueryString, [
      farePg.passenger,
      farePg.recurrence,
      farePg.departure_time,
      farePg.return_time,
      farePg.departure,
      farePg.arrival,
      farePg.distance,
      farePg.duration,
      farePg.kind,
      farePg.nature,
      farePg.driver
    ]);

const insertRecurringFareQueryString: string = `
      INSERT INTO recurring_fares (
          passenger,
          recurrence,
          departure_time,
          return_time,
          departure,
          arrival,
          distance,
          duration,
          kind,
          nature,
          driver
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  recurringCreated: [queriesResults[0]?.rows[0]].map(fromDBtoRecurringCandidate)[0]
});
