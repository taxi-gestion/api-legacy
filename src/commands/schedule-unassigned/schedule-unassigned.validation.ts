import { entityCodec, Errors, externalTypeCheckFor, toScheduledCodec, unassignedScheduledCodec } from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, ScheduleUnassigned, ToScheduled } from '../../definitions';
import { UnassignedToSchedule } from './schedule-unassigned.route';
import { intersection as ioIntersection, Type, type as ioType } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isDefinedGuard } from '../../domain';
import { toScheduledRules } from '../../codecs/domain-rules/fares.rules';

export const $scheduleUnassignedValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, UnassignedToSchedule> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ToScheduled>(unassignedToScheduleCodec),
      fromEither,
      taskEitherChain($checkUnassignedToScheduleExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const scheduledUnassignedValidation = (transfer: unknown): TaskEither<Errors, ScheduleUnassigned> =>
  pipe(transfer, externalTypeCheckFor<ScheduleUnassigned>(unassignedScheduledCodec), fromEither);

const $checkUnassignedToScheduleExist =
  (db: PostgresDb) =>
  (transfer: Entity & ToScheduled): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: unassignedId,
        ...toSchedule
      }: {
        id: string;
      } = transfer;

      const [unassignedToDelete]: (Entity | undefined)[] = (
        await db.query<Entity>('SELECT id FROM unassigned_fares WHERE id = $1 LIMIT 1', [unassignedId])
      ).rows;

      if (!isDefinedGuard(unassignedToDelete)) return throwEntityNotFoundValidationError(transfer.id);

      return {
        toSchedule,
        unassignedToDelete
      };
    }, $onInfrastructureOrValidationError(`$unassignedToScheduleExist`));

const typeCheck = (transfer: unknown): TaskEither<Errors, UnassignedToSchedule> =>
  fromEither(unassignedToSchedule.decode(transfer));

const rulesCheck = (transfer: UnassignedToSchedule): TaskEither<Errors, UnassignedToSchedule> =>
  fromEither(unassignedToScheduledRules.decode(transfer));

const unassignedToScheduleCodec: Type<Entity & ToScheduled> = ioIntersection([entityCodec, toScheduledCodec]);

const unassignedToSchedule: Type<UnassignedToSchedule> = ioType({
  toSchedule: toScheduledCodec,
  unassignedToDelete: entityCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const unassignedToScheduledRules = ioType({
  toSchedule: toScheduledRules,
  unassignedToDelete: entityCodec
});
