import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { Entity, Passenger } from '../../definitions';
import {onDatabaseError} from '../../errors';

type PassengerPersistence = Entity & {
  firstname: string;
  lastname: string;
  phone: string;
};

export const listPassengersDatabaseQuery = (database: PostgresDb) => (): TaskEither<Errors, unknown> =>
  pipe(
    listPassengers(database)(),
    taskEitherMap(toTransfer)
  );

const listPassengers = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromPassenger(database)(), onDatabaseError(`listPassengersDatabaseQuery`));

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

const toTransfer = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: PassengerPersistence): Entity & Passenger => ({
    id: row.id,
    passenger: `${row.lastname} ${row.firstname}`,
    phone: row.phone
  }));
