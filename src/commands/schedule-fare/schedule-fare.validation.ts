import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  fareToScheduleCodec,
  fareToScheduleRulesCodec,
  FareToScheduleTransfer,
  fareToScheduleTransferCodec
} from './schedule-fare.codec';
import { ToSchedule } from '../../definitions';
import { externalTypeCheckFor } from '../../codecs';

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
    datetime: fareTransfer.datetime,
    planning: fareTransfer.planning,
    departure: fareTransfer.driveFrom,
    kind: fareTransfer.driveKind,
    nature: fareTransfer.driveNature,
    phone: fareTransfer.clientPhone,
    status: 'to-schedule',
    destination: fareTransfer.driveTo,
    duration: fareTransfer.duration,
    distance: fareTransfer.distance
  });

const rulesCheckForFareToSchedule = (fareDraft: ToSchedule): Validation<ToSchedule> =>
  fareToScheduleRulesCodec.decode(fareDraft);
