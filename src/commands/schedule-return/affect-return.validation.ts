import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { ReturnToAffectTransfer, returnToAffectTransferCodec } from './affect-return.definitions';
import { FareToSchedule } from '../../definitions/fares.definitions';
import { fareToScheduleCodec, fareToScheduleRulesCodec } from '../schedule-fare/schedule-fare.definitions';
import { externalTypeCheckFor } from '../../rules/validation';
import { QueryResult } from 'pg';

export const $affectReturnValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FareToSchedule> =>
    pipe(
      transfer,
      externalTypeCheckFor<ReturnToAffectTransfer>(returnToAffectTransferCodec),
      fromEither,
      taskEitherChain($mergeContext(db)),
      taskEitherChain(internalTypeCheckForFareToSchedule),
      taskEitherChain(rulesCheckForFareToSchedule)
    );

const $mergeContext =
  (db: PostgresDb) =>
  (returnToAffectTransfer: ReturnToAffectTransfer): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const res: QueryResult = await db.query('SELECT * FROM fares_to_schedule WHERE id = $1 LIMIT 1', [
        returnToAffectTransfer.fareId
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...res.rows[0],
        time: returnToAffectTransfer.startTime,
        departure: returnToAffectTransfer.driveFrom,
        destination: returnToAffectTransfer.driveTo,
        planning: returnToAffectTransfer.planning
      };
    }, onInfrastructureError);

const internalTypeCheckForFareToSchedule = (fromDB: unknown): TaskEither<Errors, FareToSchedule> =>
  fromEither(fareToScheduleCodec.decode(fromDB));

const rulesCheckForFareToSchedule = (fareDraft: FareToSchedule): TaskEither<Errors, FareToSchedule> =>
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
