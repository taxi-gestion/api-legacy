import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { onDatabaseError } from '../../errors';
import { DriverPersistence, Entity } from '../../definitions';
import { Errors } from '../../codecs';

export const listDriversPersistenceQuery = (database: PostgresDb) => (): TaskEither<Errors, unknown> =>
  pipe(listDrivers(database)(), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: DriverPersistence & Entity): unknown => ({
    id: row.id,
    username: row.username,
    identifier: row.identifier
  }));

const listDrivers = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromDrivers(database), onDatabaseError(`listDriversPersistenceQuery`));

const selectFromDrivers = (database: PostgresDb) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateQuery(client);
  } finally {
    client.release();
  }
};

const selectFaresWhereDateQuery = async (client: PoolClient): Promise<QueryResult> => client.query(selectDriversQueryString);

const selectDriversQueryString: string = `
      SELECT id, username, identifier FROM drivers
    `;
