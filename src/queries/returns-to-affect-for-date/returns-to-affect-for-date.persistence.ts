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
import { ReturnToAffect } from '../../definitions/fares.definitions';
import { Entity } from '../../definitions/entity.definition';

type ReturnToAffectPersistence = Entity<ReturnToAffect>;

export const returnsToAffectForTheDateQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, Entity<ReturnToAffect>[]> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectReturnsToAffectForDate(database)),
      taskEitherChain(
        (queryResult: QueryResult): TaskEither<Errors, Entity<ReturnToAffect>[]> =>
          taskEitherRight(toToScheduleFares(queryResult))
      )
    );

const toToScheduleFares = (queryResult: QueryResult): Entity<ReturnToAffect>[] =>
  queryResult.rows.map(
    (row: ReturnToAffectPersistence): Entity<ReturnToAffect> => ({
      id: row.id,
      client: row.client,
      date: row.date,
      departure: row.departure,
      destination: row.destination,
      planning: row.planning,
      kind: row.kind,
      nature: row.nature,
      phone: row.phone,
      status: 'return-to-affect',
      time: row.time
    })
  );

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

const selectReturnsToAffectWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> =>
  client.query(selectReturnsToAffectWhereDateQueryString, [date]);

const selectReturnsToAffectWhereDateQueryString: string = `
      SELECT * FROM returns_to_affect WHERE date = $1
      `;
