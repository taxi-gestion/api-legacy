import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, PendingPersistence, PendingToScheduled, SchedulePending } from '../../definitions';
import { entityCodec, externalTypeCheckFor, pendingReturnCodec, pendingScheduledCodec, returnDriveCodec } from '../../codecs';
import { PendingToSchedule } from './schedule-pending.route';
import { intersection as ioIntersection, Type, type as ioType } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { fromDBtoPendingCandidate } from '../../mappers';
import { isDefinedGuard } from '../../domain';
import { returnDriveRulesCodec } from '../../rules';

export const $schedulePendingValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, PendingToSchedule> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & PendingToScheduled>(returnDriveAndPendingEntityCodec),
      fromEither,
      taskEitherChain($checkPendingToScheduleExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const scheduledPendingValidation = (transfer: unknown): TaskEither<Errors, SchedulePending> =>
  pipe(transfer, externalTypeCheckFor<SchedulePending>(pendingScheduledCodec), fromEither);

const $checkPendingToScheduleExist =
  (db: PostgresDb) =>
  (transfer: Entity & PendingToScheduled): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: pendingId,
        ...driveToSchedule
      }: {
        id: string;
      } = transfer;

      const [pendingToDelete]: ((Entity & PendingPersistence) | undefined)[] = (
        await db.query<Entity & PendingPersistence>('SELECT * FROM pending_returns WHERE id = $1 LIMIT 1', [pendingId])
      ).rows;

      if (!isDefinedGuard(pendingToDelete)) return throwEntityNotFoundValidationError(transfer.id);

      return {
        driveToSchedule,
        pendingToDelete: fromDBtoPendingCandidate(pendingToDelete)
      };
    }, $onInfrastructureOrValidationError(`$pendingToScheduleExist`));

const typeCheck = (transfer: unknown): TaskEither<Errors, PendingToSchedule> =>
  fromEither(pendingToScheduleCodec.decode(transfer));

const rulesCheck = (pendingToSchedule: PendingToSchedule): TaskEither<Errors, PendingToSchedule> =>
  fromEither(pendingToScheduleRulesCodec.decode(pendingToSchedule));

const returnDriveAndPendingEntityCodec: Type<Entity & PendingToScheduled> = ioIntersection([entityCodec, returnDriveCodec]);

const pendingToScheduleCodec: Type<PendingToSchedule> = ioType({
  driveToSchedule: returnDriveCodec,
  pendingToDelete: pendingReturnCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const pendingToScheduleRulesCodec = ioType({
  driveToSchedule: returnDriveRulesCodec,
  pendingToDelete: pendingReturnCodec
});
