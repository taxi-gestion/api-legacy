import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import {Entity, Regular, RegularPersistence} from '../../definitions';
import { onDatabaseError } from '../../errors';

export const listRegularsDatabaseQuery = (database: PostgresDb) => (): TaskEither<Errors, unknown> =>
  pipe(listRegulars(database)(), taskEitherMap(toTransfer));

const listRegulars = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromRegular(database)(), onDatabaseError(`listRegularsDatabaseQuery`));

const selectFromRegular = (database: PostgresDb) => () => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectRegularsQuery(client);
  } finally {
    client.release();
  }
};

const selectRegularsQuery = async (client: PoolClient): Promise<QueryResult> => client.query(selectRegularsQueryString);

const selectRegularsQueryString: string = `
      SELECT * FROM regulars
    `;

const toTransfer = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: Entity & RegularPersistence): Entity & Regular => ({
    id: row.id,
    firstname: row.firstname,
    lastname: row.lastname,
    phone: row.phone
  }));
