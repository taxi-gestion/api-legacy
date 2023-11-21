import {
  entityCodec,
  Errors,
  externalTypeCheckFor,
  faresSubcontractedCodec,
  fareToSubcontractCodec,
  scheduledFareCodec,
  toSubcontractCodec
} from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, ScheduledPersistence, SubcontractFare, ToSubcontracted } from '../../definitions';
import { type as ioType, Type, undefined as ioUndefined, union as ioUnion } from 'io-ts';
import { FaresToSubcontract } from './subcontract-fare.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isDefinedGuard } from '../../domain';
import { fromDBtoScheduledCandidate } from '../../mappers';

export const $subcontractFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToSubcontract> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & ToSubcontracted>(fareToSubcontractCodec),
      fromEither,
      taskEitherChain($fareToSubcontractExistIn(db)),
      taskEitherChain(internalTypeCheckForFareToSubcontract)
    );

export const subcontractedValidation = (transfer: unknown): TaskEither<Errors, SubcontractFare> =>
  pipe(transfer, externalTypeCheckFor<SubcontractFare>(faresSubcontractedCodec), fromEither);

const $fareToSubcontractExistIn =
  (db: PostgresDb) =>
  (toSubcontract: Entity & ToSubcontracted): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const [scheduledToSubcontract]: ((Entity & ScheduledPersistence) | undefined)[] = (
        await db.query<Entity & ScheduledPersistence>('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [toSubcontract.id])
      ).rows;

      if (!isDefinedGuard(scheduledToSubcontract)) return throwEntityNotFoundValidationError(toSubcontract.id);

      const [pendingToDelete]: (Entity | undefined)[] = (
        await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [toSubcontract.id])
      ).rows;

      return {
        toSubcontract,
        scheduledToCopyAndDelete: fromDBtoScheduledCandidate(scheduledToSubcontract),
        pendingToDelete
      };
    }, $onInfrastructureOrValidationError(`$fareToSubcontractExistIn`));

const internalTypeCheckForFareToSubcontract = (fromDB: unknown): TaskEither<Errors, FaresToSubcontract> =>
  fromEither(toSubcontractTransferCodec.decode(fromDB));

const toSubcontractTransferCodec: Type<FaresToSubcontract> = ioType({
  toSubcontract: toSubcontractCodec,
  scheduledToCopyAndDelete: scheduledFareCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});
