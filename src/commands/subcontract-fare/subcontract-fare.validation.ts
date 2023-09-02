import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, FaresSubcontracted, ToSubcontract, Scheduled } from '../../definitions';
import {
  entityCodec,
  externalTypeCheckFor,
  fareToSubcontractCodec,
  scheduledFareCodec,
  faresSubcontractedCodec,
  toSubcontractCodec
} from '../../codecs';
import { type as ioType, Type, union as ioUnion } from 'io-ts';
import { FaresToSubcontract } from './subcontract-fare.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isOneWay } from '../../domain';

export const $subcontractFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToSubcontract> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ToSubcontract>(fareToSubcontractCodec),
      fromEither,
      taskEitherChain($fareToSubcontractExistIn(db)),
      taskEitherChain(internalTypeCheckForFareToSubcontract)
    );

export const subcontractedValidation = (transfer: unknown): TaskEither<Errors, FaresSubcontracted> =>
  pipe(transfer, externalTypeCheckFor<FaresSubcontracted>(faresSubcontractedCodec), fromEither);

const $fareToSubcontractExistIn =
  (db: PostgresDb) =>
  (subcontractFareTransfer: Entity & ToSubcontract): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const [fareToSubcontract]: ((Entity & Scheduled) | undefined)[] = (
        await db.query<Entity & Scheduled>('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [subcontractFareTransfer.id])
      ).rows;

      if (fareToSubcontract === undefined) throwEntityNotFoundValidationError(subcontractFareTransfer.id);

      return isOneWay(fareToSubcontract as { kind: 'one-way' | 'two-way' })
        ? {
            toSubcontract: subcontractFareTransfer,
            scheduledToCopyAndDelete: fareToSubcontract
          }
        : $withPendingToDelete(db)(subcontractFareTransfer.id, {
            toSubcontract: subcontractFareTransfer,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            scheduledToCopyAndDelete: fareToSubcontract!
          });
    }, $onInfrastructureOrValidationError(`$fareToSubcontractExistIn`));

const $withPendingToDelete =
  (db: PostgresDb) =>
  async (scheduledId: string, { toSubcontract, scheduledToCopyAndDelete }: FaresToSubcontract): Promise<FaresToSubcontract> => {
    const [pendingToDelete]: (Entity | undefined)[] = (
      await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [scheduledId])
    ).rows;

    return {
      toSubcontract,
      scheduledToCopyAndDelete,
      ...(pendingToDelete === undefined ? {} : { pendingToDelete })
    } satisfies FaresToSubcontract;
  };

const internalTypeCheckForFareToSubcontract = (fromDB: unknown): TaskEither<Errors, FaresToSubcontract> =>
  fromEither(toSubcontractTransferCodec.decode(fromDB));

const toSubcontractTransferCodec: Type<FaresToSubcontract> = ioUnion([
  ioType({
    toSubcontract: toSubcontractCodec,
    scheduledToCopyAndDelete: scheduledFareCodec
  }),
  ioType({
    toSubcontract: toSubcontractCodec,
    scheduledToCopyAndDelete: scheduledFareCodec,
    pendingToDelete: entityCodec
  })
]);
