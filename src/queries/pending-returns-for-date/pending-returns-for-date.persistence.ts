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
import { Errors, InfrastructureError } from '../../reporter/http-reporter';
import { Entity, Pending } from '../../definitions';
import { addDays, subHours } from 'date-fns';

type PendingPersistence = Omit<Entity & Pending, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
};

export const pendingReturnsForTheDateDatabaseQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectPendingReturnsForDate(database)),
      taskEitherChain((queryResult: QueryResult): TaskEither<Errors, unknown> => taskEitherRight(toPendingReturns(queryResult)))
    );

const toPendingReturns = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: PendingPersistence): unknown => ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    destination: row.destination,
    driver: row.driver,
    kind: row.kind,
    nature: row.nature,
    phone: row.phone,
    status: 'pending-return'
  }));

const selectPendingReturnsForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromPendingReturns(database)(date), onSelectPendingReturnsError);

const onSelectPendingReturnsError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectPendingReturnsForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromPendingReturns = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectPendingReturnsWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const adjustFrenchDateToUTC = (date: Date): string => {
  const adjustedDate: Date = subHours(date, 2);
  return adjustedDate.toISOString();
};

const selectPendingReturnsWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> => {
  const startOfDayUTC: string = adjustFrenchDateToUTC(new Date(date));
  const endOfDayUTC: string = adjustFrenchDateToUTC(addDays(new Date(date), 1));
  return client.query(selectPendingReturnsWhereDateQueryString, [startOfDayUTC, endOfDayUTC]);
};

const selectPendingReturnsWhereDateQueryString: string = `
      SELECT * FROM pending_returns WHERE datetime >= $1 AND datetime < $2
    `;
