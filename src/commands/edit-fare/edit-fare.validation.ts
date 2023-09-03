import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, FaresEdited, ScheduledPersistence, ToEdit } from '../../definitions';
import { type as ioType, Type, union as ioUnion, undefined as ioUndefined } from 'io-ts';
import { FaresToEdit } from './edit-fare.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import {
  entityCodec,
  externalTypeCheckFor,
  faresEditedCodec,
  fareToEditCodec,
  scheduledFareCodec,
  toEditCodec
} from '../../codecs';
import { isDefinedGuard } from '../../domain';
import { fromDBtoScheduledCandidate } from '../../mappers';
import { toEditRulesCodec } from '../../rules';

export const $faresToEditValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToEdit> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ToEdit>(fareToEditCodec),
      fromEither,
      taskEitherChain($checkFareToEditExist(db)),
      taskEitherChain(typeCheck),
      taskEitherChain(rulesCheck)
    );

export const editedFaresValidation = (transfer: unknown): TaskEither<Errors, FaresEdited> =>
  pipe(transfer, externalTypeCheckFor<FaresEdited>(faresEditedCodec), fromEither);

const $checkFareToEditExist =
  (db: PostgresDb) =>
  (transfer: Entity & ToEdit): TaskEither<Errors, unknown> =>
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
        toEdit: toEdit as ToEdit,
        scheduledToEdit: fromDBtoScheduledCandidate(scheduledToEdit),
        pendingToDelete
      };
    }, $onInfrastructureOrValidationError(`$checkFareToEditExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToEdit> => fromEither(faresToEditCodec.decode(fromDB));

const rulesCheck = (fareToEdit: FaresToEdit): TaskEither<Errors, FaresToEdit> =>
  fromEither(faresToEditRulesCodec.decode(fareToEdit));

const faresToEditCodec: Type<FaresToEdit> = ioType({
  toEdit: toEditCodec,
  scheduledToEdit: scheduledFareCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});

// eslint-disable-next-line @typescript-eslint/typedef
const faresToEditRulesCodec = ioType({
  toEdit: toEditRulesCodec,
  scheduledToEdit: scheduledFareCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});
