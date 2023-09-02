import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { Entity, Scheduled } from '../../definitions';
import { addDays, subHours } from 'date-fns';
import { onDatabaseError } from '../../errors';

type ScheduledFarePersistence = Omit<Entity & Scheduled, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
};

export const scheduledFaresForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(date, fromEither, taskEitherChain(selectFaresForDate(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown =>
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
    taskEitherTryCatch(selectFromFares(database)(date), onDatabaseError(`scheduledFaresForTheDatePersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateQuery(client)(date);
  } finally {
    client.release();
  }
};

const adjustFrenchDateToUTC = (date: Date): string => {
  const adjustedDate: Date = subHours(date, 2);
  return adjustedDate.toISOString();
};

const selectFaresWhereDateQuery =
  (client: PoolClient) =>
  async (date: string): Promise<QueryResult> => {
    const startOfDayUTC: string = adjustFrenchDateToUTC(new Date(date));
    const endOfDayUTC: string = adjustFrenchDateToUTC(addDays(new Date(date), 1));
    return client.query(selectFaresWhereDateQueryString, [startOfDayUTC, endOfDayUTC]);
  };

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM scheduled_fares WHERE datetime >= $1 AND datetime < $2
    `;
