import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  FareToSchedule,
  fareToScheduleCodec,
  fareToScheduleRulesCodec,
  FareToScheduleTransfer,
  fareToScheduleTransferCodec
} from './schedule-fare.definitions';
import { externalTypeCheckFor } from '../../rules/validation';

export const scheduleFareValidation = (transfer: unknown): Either<Errors, FareToSchedule> =>
  pipe(
    transfer,
    externalTypeCheckFor<FareToScheduleTransfer>(fareToScheduleTransferCodec),
    eitherChain(internalTypeCheckForFareToSchedule),
    eitherChain(rulesCheckForFareToSchedule)
  );
const internalTypeCheckForFareToSchedule = (fareTransfer: FareToScheduleTransfer): Validation<FareToSchedule> =>
  fareToScheduleCodec.decode({
    client: fareTransfer.clientIdentity,
    date: fareTransfer.date,
    planning: fareTransfer.planning,
    departure: fareTransfer.driveFrom,
    kind: fareTransfer.driveKind,
    nature: fareTransfer.driveNature,
    phone: fareTransfer.clientPhone,
    status: 'to-schedule',
    time: fareTransfer.startTime,
    destination: fareTransfer.driveTo
  });

const rulesCheckForFareToSchedule = (fareDraft: FareToSchedule): Validation<FareToSchedule> =>
  fareToScheduleRulesCodec.decode(fareDraft);
