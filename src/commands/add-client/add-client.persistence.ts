import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { ClientToAdd } from './add-client.definitions';
import { PostgresDb } from '@fastify/postgres';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';

export type ClientPersistence = ClientToAdd;

export const toClientPersistence = (fare: Either<Errors, ClientToAdd>): Either<Errors, ClientPersistence> =>
  pipe(
    fare,
    eitherMap(
      (clientToAdd: ClientToAdd): ClientPersistence => ({
        ...clientToAdd
      })
    )
  );

export const persistClient =
  (database: PostgresDb) =>
  (clientPersistence: Either<Errors, ClientPersistence>): TaskEither<Errors, QueryResult> =>
    pipe(clientPersistence, fromEither, taskEitherChain(insertClientIn(database)));

const insertClientIn =
  (database: PostgresDb) =>
  (client: ClientPersistence): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(insertClient(database, client), onInsertClientError);

const onInsertClientError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `insertClientIn database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const insertClient = (database: PostgresDb, clientToPersist: ClientPersistence) => async (): Promise<QueryResult> =>
  database.transact(async (client: PoolClient): Promise<QueryResult> => insertClientQuery(client, clientToPersist));

const insertClientQuery = async (client: PoolClient, clientPg: ClientPersistence): Promise<QueryResult> =>
  client.query(insertClientQueryString, [clientPg.identity, clientPg.lastDeparture, clientPg.lastDestination, clientPg.phone]);

const insertClientQueryString: string = `
      INSERT INTO clients (
          identity,
          departure,
          destination,
          phone
      ) VALUES (
          $1, $2, $3, $4
      )
    `;
