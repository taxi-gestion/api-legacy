import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import { fromDBtoRegularCandidate } from '../../mappers';

export const regularByIdDatabaseQuery =
  (database: PostgresDb) =>
  (id: string): TaskEither<Errors, unknown> =>
    pipe(regularById(database)(id), taskEitherMap(toTransfer));

const regularById =
  (database: PostgresDb) =>
  (id: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromRegular(database)(id), onDatabaseError(`regularByIdDatabaseQuery`));

const selectFromRegular = (database: PostgresDb) => (id: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectRegularsQuery(client)(id);
  } finally {
    client.release();
  }
};

const selectRegularsQuery =
  (client: PoolClient) =>
  async (id: string): Promise<QueryResult> =>
    client.query(selectRegularsQueryString, [id]);

const selectRegularsQueryString: string = `
      SELECT * FROM regulars
      WHERE id = $1
    `;

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoRegularCandidate)[0];
