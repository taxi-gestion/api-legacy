import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { ReturnToAffectTransfer, returnToAffectTransferCodec } from './affect-return.codec';
import { ToSchedule } from '../../definitions';
import { fareToScheduleCodec, fareToScheduleRulesCodec } from '../schedule-fare/schedule-fare.codec';
import { QueryResult } from 'pg';
import { externalTypeCheckFor } from '../../codecs';

export const $affectReturnValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, ToSchedule> =>
    pipe(
      transfer,
      externalTypeCheckFor<ReturnToAffectTransfer>(returnToAffectTransferCodec),
      fromEither,
      taskEitherChain($returnToAffectToFareToSchedule(db)),
      taskEitherChain(internalTypeCheckForFareToSchedule),
      taskEitherChain(rulesCheckForFareToSchedule)
    );

const $returnToAffectToFareToSchedule =
  (db: PostgresDb) =>
  (returnToAffectTransfer: ReturnToAffectTransfer): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const originalReturnFareValues: QueryResult = await db.query('SELECT * FROM returns_to_affect WHERE id = $1 LIMIT 1', [
        returnToAffectTransfer.fareId
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...originalReturnFareValues.rows[0],
        status: 'to-schedule',
        datetime: returnToAffectTransfer.datetime,
        departure: returnToAffectTransfer.driveFrom,
        destination: returnToAffectTransfer.driveTo,
        duration: returnToAffectTransfer.duration,
        distance: returnToAffectTransfer.distance,
        planning: returnToAffectTransfer.planning
      };
    }, onInfrastructureError);

const internalTypeCheckForFareToSchedule = (fromDB: unknown): TaskEither<Errors, ToSchedule> =>
  fromEither(fareToScheduleCodec.decode(fromDB));

const rulesCheckForFareToSchedule = (fareDraft: ToSchedule): TaskEither<Errors, ToSchedule> =>
  fromEither(fareToScheduleRulesCodec.decode(fareDraft));

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
