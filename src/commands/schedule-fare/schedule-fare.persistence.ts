/* eslint-disable max-lines */
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import type { FareReturnToSchedule, ScheduledFare } from './schedule-fare.definitions';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';

export type ScheduledFarePersistence = ScheduledFare;
export type ToScheduleFarePersistence = FareReturnToSchedule;

export type FaresToPersist = [ScheduledFarePersistence, ToScheduleFarePersistence?];

export const toFaresPersistence = (
  fare: Either<Errors, [ScheduledFare, FareReturnToSchedule?]>
): Either<Errors, FaresToPersist> =>
  pipe(
    fare,
    eitherMap(
      ([scheduledFare, fareReturnToSchedule]: [ScheduledFare, FareReturnToSchedule?]): FaresToPersist =>
        fareReturnToSchedule == null
          ? [toScheduledFarePersistence(scheduledFare)]
          : [toScheduledFarePersistence(scheduledFare), toToScheduleFarePersistence(fareReturnToSchedule)]
    )
  );

const toScheduledFarePersistence = (scheduledFare: ScheduledFare): ScheduledFarePersistence => ({
  client: scheduledFare.client,
  creator: scheduledFare.creator,
  date: scheduledFare.date,
  departure: scheduledFare.departure,
  destination: scheduledFare.destination,
  distance: scheduledFare.distance,
  planning: scheduledFare.planning,
  duration: scheduledFare.duration,
  kind: scheduledFare.kind,
  nature: scheduledFare.nature,
  phone: scheduledFare.phone,
  status: scheduledFare.status,
  time: scheduledFare.time
});

const toToScheduleFarePersistence = (fareReturnToSchedule: FareReturnToSchedule): ToScheduleFarePersistence => ({
  client: fareReturnToSchedule.client,
  creator: fareReturnToSchedule.creator,
  date: fareReturnToSchedule.date,
  departure: fareReturnToSchedule.departure,
  destination: fareReturnToSchedule.destination,
  distance: fareReturnToSchedule.distance,
  planning: fareReturnToSchedule.planning,
  duration: fareReturnToSchedule.duration,
  kind: fareReturnToSchedule.kind,
  nature: fareReturnToSchedule.nature,
  phone: fareReturnToSchedule.phone,
  status: fareReturnToSchedule.status,
  time: fareReturnToSchedule.time
});

export const persistFares =
  (database: PostgresDb) =>
  (farePersistence: Either<Errors, FaresToPersist>): TaskEither<Errors, QueryResult[]> =>
    pipe(farePersistence, fromEither, taskEitherChain(insertFaresIn(database)));

const insertFaresIn =
  (database: PostgresDb) =>
  (fares: FaresToPersist): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(insertFares(database, fares), onInsertFareError);

const insertFares =
  (database: PostgresDb, fares: [ScheduledFarePersistence, ToScheduleFarePersistence?]) => async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const [fare, fareToSchedule]: [ScheduledFarePersistence, ToScheduleFarePersistence?] = fares;
      const promises: Promise<QueryResult>[] = [
        insertScheduledFareQuery(client, fare),
        ...insertFareToScheduleQueryOrEmpty(fareToSchedule, client)
      ];
      return Promise.all(promises);
    });

const insertFareToScheduleQueryOrEmpty = (
  fareToSchedule: ToScheduleFarePersistence | undefined,
  client: PoolClient
): [] | [Promise<QueryResult>] => (fareToSchedule == null ? [] : [insertFareToScheduleQuery(client, fareToSchedule)]);

const onInsertFareError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `insertFareIn database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const insertScheduledFareQuery = async (client: PoolClient, farePg: ScheduledFarePersistence): Promise<QueryResult> =>
  client.query(insertFareQueryString, [
    farePg.client,
    farePg.creator,
    farePg.date,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.planning,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status,
    farePg.time
  ]);

const insertFareQueryString: string = `
      INSERT INTO fares (
          client,
          creator,
          date,
          departure,
          destination,
          distance,
          planning,
          duration,
          kind,
          nature,
          phone,
          status,
          time
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
    `;

const insertFareToScheduleQuery = async (client: PoolClient, farePg: ToScheduleFarePersistence): Promise<QueryResult> =>
  client.query(insertFareToScheduleQueryString, [
    farePg.client,
    farePg.creator,
    farePg.date,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.planning,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status,
    farePg.time
  ]);

const insertFareToScheduleQueryString: string = `
      INSERT INTO fares_to_schedule (
          client,
          creator,
          date,
          departure,
          destination,
          distance,
          planning,
          duration,
          kind,
          nature,
          phone,
          status,
          time
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      `;
