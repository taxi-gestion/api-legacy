import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, Pending, ReturnDrive } from '../../definitions';
import {
  entityCodec,
  externalTypeCheckFor,
  pendingReturnCodec,
  returnDriveCodec,
  returnDriveRulesCodec,
  scheduledFareCodec
} from '../../codecs';
import { PendingScheduled, PendingToSchedule } from './schedule-pending.route';
import { intersection as ioIntersection, Type, type as ioType } from 'io-ts';
import { throwEntityNotFoundValidationError } from '../../errors/entity-not-found.validation-error';
import { $onInfrastructureOrValidationError } from '../../errors/infrastructure-or-validation.error';

export const $schedulePendingValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, PendingToSchedule> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ReturnDrive>(returnDriveAndPendingEntityCodec),
      fromEither,
      taskEitherChain($checkPendingToScheduleExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const scheduledPendingValidation = (transfer: unknown): TaskEither<Errors, PendingScheduled> =>
  pipe(transfer, externalTypeCheckFor<PendingScheduled>(pendingScheduledCodec), fromEither);

const $checkPendingToScheduleExist =
  (db: PostgresDb) =>
  (transfer: Entity & ReturnDrive): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: pendingId,
        ...driveToSchedule
      }: {
        id: string;
      } = transfer;

      const [pendingToDelete]: ((Entity & Pending) | undefined)[] = (
        await db.query<Entity & Pending>('SELECT * FROM pending_returns WHERE id = $1 LIMIT 1', [pendingId])
      ).rows;

      if (pendingToDelete === undefined) throwEntityNotFoundValidationError(transfer.id);

      return {
        driveToSchedule,
        pendingToDelete
      };
    }, $onInfrastructureOrValidationError(`$pendingToScheduleExist`));

const typeCheck = (transfer: unknown): TaskEither<Errors, PendingToSchedule> =>
  fromEither(pendingToScheduleCodec.decode(transfer));

const rulesCheck = (pendingToSchedule: PendingToSchedule): TaskEither<Errors, PendingToSchedule> =>
  fromEither(pendingToScheduleRulesCodec.decode(pendingToSchedule));

const returnDriveAndPendingEntityCodec: Type<Entity & ReturnDrive> = ioIntersection([entityCodec, returnDriveCodec]);

const pendingToScheduleCodec: Type<PendingToSchedule> = ioType({
  driveToSchedule: returnDriveCodec,
  pendingToDelete: pendingReturnCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const pendingToScheduleRulesCodec = ioType({
  driveToSchedule: returnDriveRulesCodec,
  pendingToDelete: pendingReturnCodec
});

const pendingScheduledCodec: Type<PendingScheduled> = ioType({
  scheduledCreated: scheduledFareCodec,
  pendingDeleted: pendingReturnCodec
});
