import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, right as taskEitherRight, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors, InfrastructureError } from '../../reporter/http-reporter';
import { Entity, Passenger } from '../../definitions';

type PassengerPersistence = Entity & {
  firstname: string;
  lastname: string;
  phone: string;
};

export const listPassengersDatabaseQuery = (database: PostgresDb) => (): TaskEither<Errors, (Entity & Passenger)[]> =>
  pipe(
    listPassengers(database)(),
    taskEitherChain(
      (queryResult: QueryResult): TaskEither<Errors, (Entity & Passenger)[]> => taskEitherRight(toPassengerReturns(queryResult))
    )
  );

const toPassengerReturns = (queryResult: QueryResult): (Entity & Passenger)[] =>
  queryResult.rows.map((row: PassengerPersistence): Entity & Passenger => ({
    id: row.id,
    passenger: `${row.lastname} ${row.firstname}`,
    phone: row.phone
  }));

const listPassengers = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromPassenger(database)(), onSelectPassengerReturnsError);

const onSelectPassengerReturnsError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `listPassengers database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromPassenger = (database: PostgresDb) => () => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectPassengersQuery(client);
  } finally {
    client.release();
  }
};

const selectPassengersQuery = async (client: PoolClient): Promise<QueryResult> => client.query(selectPassengersQueryString);

const selectPassengersQueryString: string = `
      SELECT * FROM passengers
    `;
