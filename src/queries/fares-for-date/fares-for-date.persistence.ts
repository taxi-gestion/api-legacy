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
import { Entity } from '../../definitions/entity.definition';
import { Scheduled } from '../../definitions/fares.definitions';

type ScheduledFarePersistence = Entity<Scheduled>;

export const faresForTheDateQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, Entity<Scheduled>[]> =>
    pipe(
      date,
      fromEither,
      taskEitherChain(selectFaresForDate(database)),
      taskEitherChain(
        (queryResult: QueryResult): TaskEither<Errors, Entity<Scheduled>[]> => taskEitherRight(toScheduledFares(queryResult))
      )
    );

/* TODO Validate with scheduledFareEntityCodec
 *  export const scheduledFareEntityCodec: Type<Entity<ScheduledFare>> = ioUnion([
 *  scheduledFareCodec,
 *   ioType({ id: ioString })
 * ])
 */

const toScheduledFares = (queryResult: QueryResult): Entity<Scheduled>[] =>
  queryResult.rows.map(
    (row: ScheduledFarePersistence): Entity<Scheduled> => ({
      id: row.id,
      client: row.client,
      creator: row.creator,
      date: row.date,
      departure: row.departure,
      destination: row.destination,
      distance: row.distance,
      planning: row.planning,
      duration: row.duration,
      kind: row.kind,
      nature: row.nature,
      phone: row.phone,
      status: 'scheduled',
      time: row.time
    })
  );

const selectFaresForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onSelectFaresError);

const onSelectFaresError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectFaresForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const selectFaresWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> =>
  client.query(selectFaresWhereDateQueryString, [date]);

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM fares WHERE date = $1
      `;
