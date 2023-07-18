import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, Type } from 'io-ts';
import {
  intersection as ioIntersection,
  keyof as ioKeyof,
  literal as ioLiteral,
  number as ioNumber,
  string as ioString,
  type as ioType,
  undefined as ioUndefined,
  union as ioUnion
} from 'io-ts';
import { isTimeISO8601String } from '../../rules/TimeISO8601.rule';
import { isFrenchPhoneNumber } from '../../rules/FrenchPhoneNumber.rule';
import { isDateISO8601String } from '../../rules/DateISO8601.rule';
import { ReturnToAffect, ToSchedule, Scheduled } from '../../definitions/fares.definitions';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

export type FareToScheduleTransfer = {
  clientIdentity: string;
  clientPhone: string;
  date: string;
  driveFrom: string;
  driveKind: 'one-way' | 'outward' | 'return';
  driveNature: 'medical' | 'standard';
  planning: string;
  driveTo: string;
  startTime: string;
};
export const fareToScheduleTransferCodec: Type<FareToScheduleTransfer> = excess(
  ioType({
    clientIdentity: ioStringWithTypeCheckFailedMessage,
    clientPhone: ioStringWithTypeCheckFailedMessage,
    date: ioStringWithTypeCheckFailedMessage,
    driveFrom: ioStringWithTypeCheckFailedMessage,
    // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
    driveKind: ioKeyof({ 'one-way': null, outward: null, return: null }),
    driveNature: ioKeyof({ medical: null, standard: null }),
    planning: ioStringWithTypeCheckFailedMessage,
    driveTo: ioStringWithTypeCheckFailedMessage,
    startTime: ioStringWithTypeCheckFailedMessage
  })
);

export const fareToScheduleCodec: Type<ToSchedule> = ioType({
  client: ioString,
  date: ioString,
  departure: ioString,
  destination: ioString,
  planning: ioString,
  // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
  kind: ioKeyof({ 'one-way': null, outward: null, return: null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('to-schedule'),
  time: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleRulesCodec = ioIntersection([
  fareToScheduleCodec,
  ioType({
    date: isDateISO8601String,
    //departure: isValidAddress => Pas de sens on vérifie juste que les coordonnées gps sont valides et on y associe le label.
    //destination: isValidAddress,
    //planning: t.intersection([isDriverPlanning, isUnassignedPlanning]),
    phone: isFrenchPhoneNumber,
    time: isTimeISO8601String
  })
]);

export const farReturnToScheduleCodec: Type<ReturnToAffect> = ioType({
  client: ioString,
  date: ioString,
  departure: ioString,
  destination: ioString,
  planning: ioUnion([ioString, ioUndefined]),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  kind: ioLiteral('return'),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('return-to-affect'),
  time: ioUnion([ioString, ioUndefined])
});

export const scheduledFareCodec: Type<Scheduled> = ioType({
  client: ioString,
  creator: ioString,
  date: ioString,
  departure: ioString,
  destination: ioString,
  distance: ioNumber,
  planning: ioString,
  duration: ioNumber,
  // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
  kind: ioKeyof({ 'one-way': null, outward: null, return: null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('scheduled'),
  time: ioString
});
