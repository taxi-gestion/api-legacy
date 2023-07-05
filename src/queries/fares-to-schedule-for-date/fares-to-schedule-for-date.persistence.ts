import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import {
  chain as taskEitherChain,
  fromEither,
  tryCatch as taskEitherTryCatch,
  right as taskEitherRight
} from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { FareReturnToSchedule, FareReturnsToSchedule } from '../../commands/schedule-fare/schedule-fare.definitions';
import { ToScheduleFarePersistence } from '../../commands/schedule-fare/schedule-fare.persistence';

export const faresToScheduleForTheDateQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, FareReturnsToSchedule> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectFaresToScheduleForDate(database)),
      taskEitherChain(
        (queryResult: QueryResult): TaskEither<Errors, FareReturnsToSchedule> => taskEitherRight(toToScheduleFares(queryResult))
      )
    );

const toToScheduleFares = (queryResult: QueryResult): FareReturnsToSchedule =>
  queryResult.rows.map(
    (row: ToScheduleFarePersistence): FareReturnToSchedule => ({
      client: row.client,
      creator: row.creator,
      date: row.date,
      departure: row.departure,
      destination: row.destination,
      distance: row.distance,
      planning: row.planning,
      duration: row.duration,
      kind: row.kind,
      nature: row.nature,
      phone: row.phone,
      status: 'to-schedule',
      time: row.time
    })
  );

const selectFaresToScheduleForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFaresToSchedule(database)(date), onSelectFaresToScheduleError);

const onSelectFaresToScheduleError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectFaresToScheduleForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromFaresToSchedule = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresToScheduleWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const selectFaresToScheduleWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> =>
  client.query(selectFaresWhereDateQueryString, [date]);

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM fares_to_schedule WHERE date = $1
      `;
