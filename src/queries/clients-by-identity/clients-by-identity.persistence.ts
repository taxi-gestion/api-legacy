import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import {
  chain as taskEitherChain,
  fromEither,
  tryCatch as taskEitherTryCatch,
  right as taskEitherRight
} from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { ClientForFare, ClientsForFare } from './clients-by-identity.definitions';
import { ClientPersistence } from '../../commands/add-client/add-client.persistence';

export const clientsByIdentityQuery =
  (database: PostgresDb) =>
  (identity: Either<Errors, string>): TaskEither<Errors, ClientsForFare> =>
    pipe(
      identity,
      fromEither,
      taskEitherChain(selectClientsByIdentity(database)),
      taskEitherChain(
        (queryResult: QueryResult): TaskEither<Errors, ClientsForFare> => taskEitherRight(toClientsForFare(queryResult))
      )
    );

const toClientsForFare = (queryResult: QueryResult): ClientsForFare =>
  queryResult.rows.map(
    (row: ClientPersistence): ClientForFare => ({
      ...row
    })
  );

const selectClientsByIdentity =
  (database: PostgresDb) =>
  (identity: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromClients(database)(identity), onSelectClientsError);

const onSelectClientsError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectClients by identity database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromClients = (database: PostgresDb) => (identity: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectClientsWhereIdentityQuery(client, identity);
  } finally {
    client.release();
  }
};

const selectClientsWhereIdentityQuery = async (client: PoolClient, identity: string): Promise<QueryResult> =>
  client.query(selectClientsWhereIdentityQueryString, [identity]);

const selectClientsWhereIdentityQueryString: string = `
      SELECT * FROM clients WHERE identity = $1
      `;
