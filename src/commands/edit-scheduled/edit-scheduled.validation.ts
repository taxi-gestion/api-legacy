import {
  entityCodec,
  Errors,
  externalTypeCheckFor,
  scheduledEditedCodec,
  scheduledFareCodec,
  scheduledToEditCodec,
  toEditCodec
} from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { EditScheduled, Entity, ScheduledPersistence, ToScheduledEdited } from '../../definitions';
import { type as ioType, Type, undefined as ioUndefined, union as ioUnion } from 'io-ts';
import { FaresToEdit } from './edit-scheduled.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isDefinedGuard } from '../../domain';
import { fromDBtoScheduledCandidate } from '../../mappers';
import { toScheduledEditedRules } from '../../codecs/domain-rules/fares.rules';

export const $faresToEditValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToEdit> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ToScheduledEdited>(scheduledToEditCodec),
      fromEither,
      taskEitherChain($checkScheduledToEditExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const editedFaresValidation = (transfer: unknown): TaskEither<Errors, EditScheduled> =>
  pipe(transfer, externalTypeCheckFor<EditScheduled>(scheduledEditedCodec), fromEither);

const $checkScheduledToEditExist =
  (db: PostgresDb) =>
  (transfer: Entity & ToScheduledEdited): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const {
        id: scheduledId,
        ...toEdit
      }: {
        id: string;
      } = transfer;

      const [scheduledToEdit]: ((Entity & ScheduledPersistence) | undefined)[] = (
        await db.query<Entity & ScheduledPersistence>('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [scheduledId])
      ).rows;

      if (!isDefinedGuard(scheduledToEdit)) return throwEntityNotFoundValidationError(transfer.id);

      const [pendingToDelete]: (Entity | undefined)[] = (
        await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [scheduledId])
      ).rows;

      return {
        toEdit: toEdit as ToScheduledEdited,
        scheduledToEdit: fromDBtoScheduledCandidate(scheduledToEdit),
        pendingToDelete
      };
    }, $onInfrastructureOrValidationError(`$checkScheduledToEditExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToEdit> => fromEither(faresToEditCodec.decode(fromDB));

const rulesCheck = (scheduledToEdit: FaresToEdit): TaskEither<Errors, FaresToEdit> =>
  fromEither(faresToEditRules.decode(scheduledToEdit));

const faresToEditCodec: Type<FaresToEdit> = ioType({
  toEdit: toEditCodec,
  scheduledToEdit: scheduledFareCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});

// eslint-disable-next-line @typescript-eslint/typedef
const faresToEditRules = ioType({
  toEdit: toScheduledEditedRules,
  scheduledToEdit: scheduledFareCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});
