import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { Entity, ScheduledPersistence } from '../../definitions';
import { onDatabaseError } from '../../errors';
import { DriverIdAndDate } from './driver-agenda-for-date.route';

export const driverScheduledFareForTheDatePersistenceQuery =
  (database: PostgresDb) =>
  (parameters: Either<Errors, DriverIdAndDate>): TaskEither<Errors, unknown> =>
    pipe(parameters, fromEither, taskEitherChain(selectFaresForDriverAndDate(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown =>
  queryResult.rows.map((row: Entity & ScheduledPersistence): unknown => ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    arrival: row.arrival,
    distance: Number(row.distance),
    driver: row.driver,
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    status: 'scheduled'
  }));

const selectFaresForDriverAndDate =
  (database: PostgresDb) =>
  (parameters: DriverIdAndDate): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(parameters), onDatabaseError(`driverScheduledFareForTheDatePersistenceQuery`));

const selectFromFares = (database: PostgresDb) => (parameters: DriverIdAndDate) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateAndDriverQuery(client)(parameters);
  } finally {
    client.release();
  }
};

const selectFaresWhereDateAndDriverQuery =
  (client: PoolClient) =>
  async (parameters: DriverIdAndDate): Promise<QueryResult> =>
    client.query(selectFaresWhereDriverAndDateQueryString, [parameters.driverId, parameters.date]);

const selectFaresWhereDriverAndDateQueryString: string = `
      SELECT * FROM scheduled_fares WHERE (driver->>'id') = $1 AND datetime >= $2::DATE AND datetime < ($2::DATE + INTERVAL '1 day')
    `;
