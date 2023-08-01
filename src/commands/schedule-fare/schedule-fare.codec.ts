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
  union as ioUnion,
  null as ioNull
} from 'io-ts';
import { ReturnToAffect, Scheduled, ToSchedule } from '../../definitions';
import { isDateISO8601String, isFrenchPhoneNumber, isTimeISO8601String, placeCodec, placeRulesCodec } from '../../codecs';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

type PlaceTransfer = {
  context: string;
  label: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

export type FareToScheduleTransfer = {
  clientIdentity: string;
  clientPhone: string;
  date: string;
  driveFrom: PlaceTransfer;
  driveKind: 'one-way' | 'outward' | 'return';
  driveNature: 'medical' | 'standard';
  planning: string;
  driveTo: PlaceTransfer;
  startTime: string;
  duration: number;
  distance: number;
  recurrence: null | undefined;
};

export const fareToScheduleTransferCodec: Type<FareToScheduleTransfer> = excess(
  ioType({
    clientIdentity: ioStringWithTypeCheckFailedMessage,
    clientPhone: ioStringWithTypeCheckFailedMessage,
    date: ioStringWithTypeCheckFailedMessage,
    driveFrom: ioType({
      context: ioString,
      label: ioString,
      location: ioType({
        latitude: ioNumber,
        longitude: ioNumber
      })
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
    driveKind: ioKeyof({ 'one-way': null, outward: null, return: null }),
    driveNature: ioKeyof({ medical: null, standard: null }),
    planning: ioStringWithTypeCheckFailedMessage,
    driveTo: ioType({
      context: ioString,
      label: ioString,
      location: ioType({
        latitude: ioNumber,
        longitude: ioNumber
      })
    }),
    startTime: ioStringWithTypeCheckFailedMessage,
    duration: ioNumber,
    distance: ioNumber,
    recurrence: ioUnion([ioUndefined, ioNull])
  })
);

export const fareToScheduleCodec: Type<ToSchedule> = ioType({
  client: ioString,
  date: ioString,
  departure: placeCodec,
  destination: placeCodec,
  planning: ioString,
  // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
  kind: ioKeyof({ 'one-way': null, outward: null, return: null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('to-schedule'),
  time: ioString,
  duration: ioNumber,
  distance: ioNumber
});

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleRulesCodec = ioIntersection([
  fareToScheduleCodec,
  ioType({
    date: isDateISO8601String,
    departure: placeRulesCodec,
    destination: placeRulesCodec,
    //planning: t.intersection([isDriverPlanning, isUnassignedPlanning]),
    phone: isFrenchPhoneNumber,
    time: isTimeISO8601String
  })
]);

export const farReturnToScheduleCodec: Type<ReturnToAffect> = ioType({
  client: ioString,
  date: ioString,
  departure: placeCodec,
  destination: placeCodec,
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
  departure: placeCodec,
  destination: placeCodec,
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
