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
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Entity, Pending } from '../../definitions';
import { addDays, subHours } from 'date-fns';

type PendingPersistence = Entity & Pending;

export const pendingReturnsForTheDateDatabaseQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, (Entity & Pending)[]> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectReturnsToAffectForDate(database)),
      taskEitherChain(
        (queryResult: QueryResult): TaskEither<Errors, (Entity & Pending)[]> => taskEitherRight(toReturnsToAffect(queryResult))
      )
    );

const toReturnsToAffect = (queryResult: QueryResult): (Entity & Pending)[] =>
  queryResult.rows.map((row: PendingPersistence): Entity & Pending => ({
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

const selectReturnsToAffectForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromReturnsToAffect(database)(date), onSelectReturnsToAffectError);

const onSelectReturnsToAffectError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectReturnsToAffectForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromReturnsToAffect = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectReturnsToAffectWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const adjustFrenchDateToUTC = (date: Date): string => {
  const adjustedDate: Date = subHours(date, 2);
  return adjustedDate.toISOString();
};

const selectReturnsToAffectWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> => {
  const startOfDayUTC: string = adjustFrenchDateToUTC(new Date(date));
  const endOfDayUTC: string = adjustFrenchDateToUTC(addDays(new Date(date), 1));
  return client.query(selectReturnsToAffectWhereDateQueryString, [startOfDayUTC, endOfDayUTC]);
};

const selectReturnsToAffectWhereDateQueryString: string = `
      SELECT * FROM fares WHERE datetime >= $1 AND datetime < $2
    `;
