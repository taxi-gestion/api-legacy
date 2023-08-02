import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, Type } from 'io-ts';
import {
  intersection as ioIntersection,
  keyof as ioKeyof,
  literal as ioLiteral,
  null as ioNull,
  number as ioNumber,
  string as ioString,
  type as ioType,
  undefined as ioUndefined,
  union as ioUnion
} from 'io-ts';
import { ReturnToAffect, Scheduled, ToSchedule } from '../../definitions';
import { isDateTimeISO8601String, isFrenchPhoneNumber, placeCodec, placeRulesCodec } from '../../codecs';

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
  datetime: string;
  driveFrom: PlaceTransfer;
  driveKind: 'one-way' | 'outward' | 'return';
  driveNature: 'medical' | 'standard';
  planning: string;
  driveTo: PlaceTransfer;
  duration: number;
  distance: number;
  recurrence: null | undefined;
};

export const fareToScheduleTransferCodec: Type<FareToScheduleTransfer> = excess(
  ioType({
    clientIdentity: ioStringWithTypeCheckFailedMessage,
    clientPhone: ioStringWithTypeCheckFailedMessage,
    datetime: ioStringWithTypeCheckFailedMessage,
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
    duration: ioNumber,
    distance: ioNumber,
    recurrence: ioUnion([ioUndefined, ioNull])
  })
);

export const fareToScheduleCodec: Type<ToSchedule> = ioType({
  client: ioString,
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec,
  planning: ioString,
  // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
  kind: ioKeyof({ 'one-way': null, outward: null, return: null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('to-schedule'),
  duration: ioNumber,
  distance: ioNumber
});

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleRulesCodec = ioIntersection([
  fareToScheduleCodec,
  ioType({
    datetime: isDateTimeISO8601String,
    departure: placeRulesCodec,
    destination: placeRulesCodec,
    //planning: t.intersection([isDriverPlanning, isUnassignedPlanning]),
    phone: isFrenchPhoneNumber
  })
]);

export const fareReturnToScheduleCodec: Type<ReturnToAffect> = ioType({
  client: ioString,
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec,
  planning: ioUnion([ioString, ioUndefined]),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  kind: ioLiteral('return'),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('return-to-affect')
});

export const scheduledFareCodec: Type<Scheduled> = ioType({
  client: ioString,
  creator: ioString,
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec,
  distance: ioNumber,
  planning: ioString,
  duration: ioNumber,
  // eslint-disable-next-line @typescript-eslint/naming-convention,quote-props
  kind: ioKeyof({ 'one-way': null, outward: null, return: null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('scheduled')
});
