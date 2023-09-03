import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, FaresSubcontracted, ToSubcontract, ScheduledPersistence } from '../../definitions';
import {
  entityCodec,
  externalTypeCheckFor,
  fareToSubcontractCodec,
  scheduledFareCodec,
  faresSubcontractedCodec,
  toSubcontractCodec
} from '../../codecs';
import { type as ioType, Type, union as ioUnion, undefined as ioUndefined } from 'io-ts';
import { FaresToSubcontract } from './subcontract-fare.route';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { isDefinedGuard } from '../../domain';
import { fromDBtoScheduledCandidate } from '../../mappers';

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
  (toSubcontract: Entity & ToSubcontract): TaskEither<Errors, unknown> =>
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
