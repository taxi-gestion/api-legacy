import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import {
  chain as taskEitherChain,
  fromEither,
  right as taskEitherRight,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors, InfrastructureError } from '../../reporter';
import { Entity, Scheduled } from '../../definitions';
import { addDays, subHours } from 'date-fns';

type ScheduledFarePersistence = Omit<Entity & Scheduled, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
};

export const scheduledFaresForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectFaresForDate(database)),
      taskEitherChain((queryResult: QueryResult): TaskEither<Errors, unknown> => taskEitherRight(toScheduledFares(queryResult)))
    );

const toScheduledFares = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: ScheduledFarePersistence): unknown => ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    destination: row.destination,
    distance: Number(row.distance),
    driver: row.driver,
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    phone: row.phone,
    status: 'scheduled'
  }));

const selectFaresForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onSelectFaresError);

const onSelectFaresError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectFaresForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const adjustFrenchDateToUTC = (date: Date): string => {
  const adjustedDate: Date = subHours(date, 2);
  return adjustedDate.toISOString();
};

const selectFaresWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> => {
  const startOfDayUTC: string = adjustFrenchDateToUTC(new Date(date));
  const endOfDayUTC: string = adjustFrenchDateToUTC(addDays(new Date(date), 1));
  return client.query(selectFaresWhereDateQueryString, [startOfDayUTC, endOfDayUTC]);
};

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM scheduled_fares WHERE datetime >= $1 AND datetime < $2
    `;
