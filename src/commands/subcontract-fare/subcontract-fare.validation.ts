import {
  entityCodec,
  Errors,
  externalTypeCheckFor,
  faresSubcontractedCodec,
  fareToSubcontractCodec,
  pendingReturnCodec,
  scheduledFareCodec,
  toSubcontractCodec,
  unassignedFareCodec
} from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import {
  Entity,
  PendingPersistence,
  ScheduledPersistence,
  SubcontractFare,
  ToSubcontracted,
  UnassignedPersistence
} from '../../definitions';
import { Type, type as ioType, undefined as ioUndefined, union as ioUnion } from 'io-ts';
import { FaresToSubcontract } from './subcontract-fare.route';
import { $onInfrastructureOrValidationError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, fromDBtoUnassignedCandidate } from '../../mappers';

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

/* eslint-disable max-lines-per-function */
const $fareToSubcontractExistIn =
  (db: PostgresDb) =>
  (toSubcontract: Entity & ToSubcontracted): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const [scheduledToSubcontract]: ((Entity & ScheduledPersistence) | undefined)[] = (
        await db.query<Entity & ScheduledPersistence>('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [toSubcontract.id])
      ).rows;

      const [pendingToSubcontract]: ((Entity & PendingPersistence) | undefined)[] = (
        await db.query<Entity & PendingPersistence>('SELECT * FROM pending_returns WHERE id = $1 LIMIT 1', [toSubcontract.id])
      ).rows;

      const [unassignedToSubcontract]: ((Entity & UnassignedPersistence) | undefined)[] = (
        await db.query<Entity & UnassignedPersistence>('SELECT * FROM unassigned_fares WHERE id = $1 LIMIT 1', [
          toSubcontract.id
        ])
      ).rows;

      return {
        toSubcontract,
        toCopyAndDelete: {
          ...(scheduledToSubcontract === undefined ? {} : (fromDBtoScheduledCandidate(scheduledToSubcontract) as object)),
          ...(pendingToSubcontract === undefined ? {} : (fromDBtoPendingCandidate(pendingToSubcontract) as object)),
          ...(unassignedToSubcontract === undefined ? {} : (fromDBtoUnassignedCandidate(unassignedToSubcontract) as object))
        },
        pendingToDelete: pendingToSubcontract === undefined ? undefined : { id: pendingToSubcontract.id },
        unassignedToDelete: unassignedToSubcontract === undefined ? undefined : { id: unassignedToSubcontract.id },
        scheduledToDelete: scheduledToSubcontract === undefined ? undefined : { id: scheduledToSubcontract.id }
      };
    }, $onInfrastructureOrValidationError(`$fareToSubcontractExistIn`));

const internalTypeCheckForFareToSubcontract = (fromDB: unknown): TaskEither<Errors, FaresToSubcontract> =>
  fromEither(toSubcontractTransferCodec.decode(fromDB)) as unknown as TaskEither<Errors, FaresToSubcontract>;

const toSubcontractTransferCodec: Type<FaresToSubcontract> = ioType({
  toSubcontract: toSubcontractCodec,
  toCopyAndDelete: ioUnion([scheduledFareCodec, pendingReturnCodec, unassignedFareCodec]),
  pendingToDelete: ioUnion([entityCodec, ioUndefined]),
  unassignedToDelete: ioUnion([entityCodec, ioUndefined]),
  scheduledToDelete: ioUnion([entityCodec, ioUndefined])
});
