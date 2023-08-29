import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { CompletedReturnToSchedule, Entity, ReturnToSchedule } from '../../definitions';
import { QueryResult } from 'pg';
import {
  completedReturnToScheduleCodec,
  completedReturnToScheduleRulesCodec,
  externalTypeCheckFor,
  returnToScheduleCodec
} from '../../codecs';

export const $scheduleReturnValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, CompletedReturnToSchedule & Entity> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ReturnToSchedule>(returnToScheduleCodec),
      fromEither,
      taskEitherChain($returnToScheduleToFareToSchedule(db)),
      taskEitherChain(internalTypeCheckForReturnToSchedule),
      taskEitherChain(rulesCheckForReturnToSchedule)
    );

const $returnToScheduleToFareToSchedule =
  (db: PostgresDb) =>
  (scheduleReturnTransfer: Entity & ReturnToSchedule): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const originalReturnFareValues: QueryResult = await db.query('SELECT * FROM pending_returns WHERE id = $1 LIMIT 1', [
        scheduleReturnTransfer.id
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...originalReturnFareValues.rows[0],
        status: 'return-to-schedule',
        datetime: scheduleReturnTransfer.datetime,
        departure: scheduleReturnTransfer.departure,
        destination: scheduleReturnTransfer.destination,
        duration: scheduleReturnTransfer.duration,
        distance: scheduleReturnTransfer.distance,
        driver: scheduleReturnTransfer.driver,
        id: scheduleReturnTransfer.id
      };
    }, onInfrastructureError);

const internalTypeCheckForReturnToSchedule = (fromDB: unknown): TaskEither<Errors, CompletedReturnToSchedule & Entity> =>
  fromEither(completedReturnToScheduleCodec.decode(fromDB));

const rulesCheckForReturnToSchedule = (
  returnToSchedule: CompletedReturnToSchedule & Entity
): TaskEither<Errors, CompletedReturnToSchedule & Entity> =>
  fromEither(completedReturnToScheduleRulesCodec.decode(returnToSchedule));

const onInfrastructureError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;
