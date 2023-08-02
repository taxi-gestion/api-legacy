/* eslint-disable max-lines */
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { ReturnToAffect, Scheduled } from '../../definitions/fares.definitions';

export type ScheduledPersistence = Scheduled;
type ReturnToAffectPersistence = ReturnToAffect;

export type FaresToPersist = [ScheduledPersistence, ReturnToAffectPersistence?];

export const toFaresPersistence = (fare: Either<Errors, [Scheduled, ReturnToAffect?]>): Either<Errors, FaresToPersist> =>
  pipe(
    fare,
    eitherMap(
      ([scheduledFare, fareReturnToSchedule]: [Scheduled, ReturnToAffect?]): FaresToPersist =>
        fareReturnToSchedule == null
          ? [toScheduledFarePersistence(scheduledFare)]
          : [toScheduledFarePersistence(scheduledFare), toToScheduleFarePersistence(fareReturnToSchedule)]
    )
  );

const toScheduledFarePersistence = (scheduledFare: Scheduled): ScheduledPersistence => ({
  client: scheduledFare.client,
  creator: scheduledFare.creator,
  datetime: scheduledFare.datetime,
  departure: scheduledFare.departure,
  destination: scheduledFare.destination,
  distance: scheduledFare.distance,
  planning: scheduledFare.planning,
  duration: scheduledFare.duration,
  kind: scheduledFare.kind,
  nature: scheduledFare.nature,
  phone: scheduledFare.phone,
  status: scheduledFare.status
});

const toToScheduleFarePersistence = (fareReturnToSchedule: ReturnToAffect): ReturnToAffectPersistence => ({
  client: fareReturnToSchedule.client,
  datetime: fareReturnToSchedule.datetime,
  departure: fareReturnToSchedule.departure,
  destination: fareReturnToSchedule.destination,
  planning: fareReturnToSchedule.planning,
  kind: fareReturnToSchedule.kind,
  nature: fareReturnToSchedule.nature,
  phone: fareReturnToSchedule.phone,
  status: fareReturnToSchedule.status
});

export const persistFares =
  (database: PostgresDb) =>
  (farePersistence: Either<Errors, FaresToPersist>): TaskEither<Errors, QueryResult[]> =>
    pipe(farePersistence, fromEither, taskEitherChain(insertFaresIn(database)));

const insertFaresIn =
  (database: PostgresDb) =>
  (fares: FaresToPersist): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(insertFares(database, fares), onInsertFaresError);

const insertFares =
  (database: PostgresDb, fares: [ScheduledPersistence, ReturnToAffectPersistence?]) => async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const [fare, fareToSchedule]: [ScheduledPersistence, ReturnToAffectPersistence?] = fares;
      const promises: Promise<QueryResult>[] = [
        insertScheduledFareQuery(client, fare),
        ...insertReturnToAffectQueryOrEmpty(fareToSchedule, client)
      ];
      return Promise.all(promises);
    });

const insertReturnToAffectQueryOrEmpty = (
  fareToSchedule: ReturnToAffectPersistence | undefined,
  client: PoolClient
): [] | [Promise<QueryResult>] => (fareToSchedule == null ? [] : [insertReturnToAffectQuery(client, fareToSchedule)]);

const onInsertFaresError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `insertFaresIn database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const insertScheduledFareQuery = async (client: PoolClient, farePg: ScheduledPersistence): Promise<QueryResult> =>
  client.query(insertFareQueryString, [
    farePg.client,
    farePg.creator,
    farePg.datetime,
    JSON.stringify(farePg.departure),
    JSON.stringify(farePg.destination),
    farePg.distance,
    farePg.planning,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status
  ]);

const insertFareQueryString: string = `
      INSERT INTO fares (
          client,
          creator,
          datetime,
          departure,
          destination,
          distance,
          planning,
          duration,
          kind,
          nature,
          phone,
          status
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `;

const insertReturnToAffectQuery = async (client: PoolClient, farePg: ReturnToAffectPersistence): Promise<QueryResult> =>
  client.query(insertReturnToAffectQueryString, [
    farePg.client,
    farePg.datetime,
    JSON.stringify(farePg.departure),
    JSON.stringify(farePg.destination),
    farePg.planning,
    farePg.kind,
    farePg.nature,
    farePg.phone
  ]);

const insertReturnToAffectQueryString: string = `
      INSERT INTO returns_to_affect (
          client,
          datetime,
          departure,
          destination,
          planning,
          kind,
          nature,
          phone
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
      )
      `;
