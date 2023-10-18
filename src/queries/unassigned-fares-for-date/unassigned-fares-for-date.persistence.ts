import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import { fromDBtoUnassignedCandidate } from '../../mappers';

export const unassignedFaresForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(date, fromEither, taskEitherChain(selectFaresForDate(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoUnassignedCandidate);

const selectFaresForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onDatabaseError(`unassignedFaresForTheDatePersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectUnassignedFaresWhereDateQuery(client)(date);
  } finally {
    client.release();
  }
};

const selectUnassignedFaresWhereDateQuery =
  (client: PoolClient) =>
  async (date: string): Promise<QueryResult> =>
    client.query(selectFaresWhereDateQueryString, [date]);

const selectFaresWhereDateQueryString: string = `
  SELECT * FROM unassigned_fares 
  WHERE datetime >= $1::DATE AND datetime < ($1::DATE + INTERVAL '1 day')
`;
