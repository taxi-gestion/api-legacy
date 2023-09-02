import { Errors } from '../../reporter/http-reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, Scheduled, ToEdit } from '../../definitions';
import { type as ioType, Type, union as ioUnion } from 'io-ts';
import { FaresEdited, FaresToEdit } from './edit-fare.route';
import { throwEntityNotFoundValidationError } from '../../reporter/entity-not-found.validation-error';
import { $onInfrastructureOrValidationError } from '../../reporter/infrastructure-or-validation.error';
import {
  entityCodec,
  externalTypeCheckFor,
  fareToEditCodec,
  pendingReturnCodec,
  scheduledFareCodec,
  toEditCodec,
  toEditRulesCodec
} from '../../codecs';

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

      const [scheduledToEdit]: ((Entity & Scheduled) | undefined)[] = (
        await db.query<Entity & Scheduled>('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [scheduledId])
      ).rows;

      if (scheduledToEdit === undefined) throwEntityNotFoundValidationError(transfer.id);

      return isOneWay(scheduledToEdit as Scheduled)
        ? { toEdit: toEdit as ToEdit, scheduledToEdit }
        : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          $withPendingToDelete(db)(scheduledId, { toEdit: toEdit as ToEdit, scheduledToEdit } as FaresToEdit);
    }, $onInfrastructureOrValidationError(`$checkFareToEditExist`));

const $withPendingToDelete =
  (db: PostgresDb) =>
  async (scheduledId: string, faresToEdit: FaresToEdit): Promise<FaresToEdit> => {
    const [pendingToDelete]: (Entity | undefined)[] = (
      await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [scheduledId])
    ).rows;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      ...faresToEdit,
      pendingToDelete
    } as FaresToEdit;
  };

const isOneWay = (scheduled: Scheduled): boolean => scheduled.kind === 'one-way';

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToEdit> => fromEither(faresToEditCodec.decode(fromDB));

const rulesCheck = (fareToEdit: FaresToEdit): TaskEither<Errors, FaresToEdit> =>
  fromEither(faresToEditRulesCodec.decode(fareToEdit));

const faresToEditCodec: Type<FaresToEdit> = ioUnion([
  ioType({
    toEdit: toEditCodec,
    scheduledToEdit: scheduledFareCodec
  }),
  ioType({
    toEdit: toEditCodec,
    scheduledToEdit: scheduledFareCodec,
    pendingToDelete: entityCodec
  })
]);

// eslint-disable-next-line @typescript-eslint/typedef
const faresToEditRulesCodec = ioUnion([
  ioType({
    toEdit: toEditRulesCodec,
    scheduledToEdit: scheduledFareCodec
  }),
  ioType({
    toEdit: toEditRulesCodec,
    scheduledToEdit: scheduledFareCodec,
    pendingToDelete: entityCodec
  })
]);

const faresEditedCodec: Type<FaresEdited> = ioUnion([
  ioType({
    scheduledEdited: scheduledFareCodec
  }),
  ioType({
    scheduledEdited: scheduledFareCodec,
    pendingCreated: pendingReturnCodec
  }),
  ioType({
    scheduledEdited: scheduledFareCodec,
    pendingCreated: pendingReturnCodec,
    pendingDeleted: pendingReturnCodec
  }),
  ioType({
    scheduledEdited: scheduledFareCodec,
    pendingDeleted: pendingReturnCodec
  })
]);
