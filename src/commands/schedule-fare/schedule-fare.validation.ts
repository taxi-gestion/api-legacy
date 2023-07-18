import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  fareToScheduleCodec,
  fareToScheduleRulesCodec,
  FareToScheduleTransfer,
  fareToScheduleTransferCodec
} from './schedule-fare.codec';
import { externalTypeCheckFor } from '../../rules/validation';
import { ToSchedule } from '../../definitions/fares.definitions';

export const scheduleFareValidation = (transfer: unknown): Either<Errors, ToSchedule> =>
  pipe(
    transfer,
    externalTypeCheckFor<FareToScheduleTransfer>(fareToScheduleTransferCodec),
    eitherChain(internalTypeCheckForFareToSchedule),
    eitherChain(rulesCheckForFareToSchedule)
  );
const internalTypeCheckForFareToSchedule = (fareTransfer: FareToScheduleTransfer): Validation<ToSchedule> =>
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

const rulesCheckForFareToSchedule = (fareDraft: ToSchedule): Validation<ToSchedule> =>
  fareToScheduleRulesCodec.decode(fareDraft);
