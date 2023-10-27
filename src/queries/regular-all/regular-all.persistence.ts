import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import { fromDBtoRegularCandidate } from '../../mappers';

export const allRegularsDatabaseQuery = (database: PostgresDb): TaskEither<Errors, unknown> =>
  pipe(allRegulars(database)(), taskEitherMap(toTransfer));

const allRegulars = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromRegular(database)(), onDatabaseError(`allRegularsDatabaseQuery`));

const selectFromRegular = (database: PostgresDb) => () => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectRegularsQuery(client)();
  } finally {
    client.release();
  }
};

const selectRegularsQuery = (client: PoolClient) => async (): Promise<QueryResult> => client.query(selectRegularsQueryString);

const selectRegularsQueryString: string = `
      SELECT * FROM regulars
    `;

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoRegularCandidate);
