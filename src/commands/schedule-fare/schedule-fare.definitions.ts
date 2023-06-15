import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, TypeOf } from 'io-ts';
import {
  intersection as ioIntersection,
  keyof as ioKeyof,
  literal as ioLiteral,
  number as ioNumber,
  string as ioString,
  type as ioType
} from 'io-ts';
import type { FastifyRequest } from 'fastify';
import { isTimeISO8601String } from '../../rules/TimeISO8601.rule';
import { isRegisteredClient } from '../../rules/RegisteredClient.rule';
import { isFrenchPhoneNumber } from '../../rules/FrenchPhoneNumber.rule';
import { isDateISO8601String } from '../../rules/DateISO8601.rule';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleTransferCodec = excess(
  ioType({
    clientIdentity: ioStringWithTypeCheckFailedMessage,
    clientPhone: ioStringWithTypeCheckFailedMessage,
    date: ioStringWithTypeCheckFailedMessage,
    driveFrom: ioStringWithTypeCheckFailedMessage,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    driveKind: ioKeyof({ 'one-way': null, outward: null, 'go-back': null }),
    driveNature: ioKeyof({ medical: null, standard: null }),
    planning: ioStringWithTypeCheckFailedMessage,
    driveTo: ioStringWithTypeCheckFailedMessage,
    startTime: ioStringWithTypeCheckFailedMessage
  })
);

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleCodec = ioType({
  client: ioString,
  date: ioString,
  departure: ioString,
  destination: ioString,
  planning: ioString,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  kind: ioKeyof({ 'one-way': null, outward: null, 'go-back': null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('to-schedule'),
  time: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleRulesCodec = ioIntersection([
  fareToScheduleCodec,
  ioType({
    client: isRegisteredClient,
    date: isDateISO8601String,
    //departure: isValidAddress => Pas de sens on vérifie juste que les coordonnées gps sont valides et on y associe le label.
    //destination: isValidAddress,
    //planning: t.intersection([isDriverPlanning, isUnassignedPlanning]),
    phone: isFrenchPhoneNumber,
    time: isTimeISO8601String
  })
]);

// eslint-disable-next-line @typescript-eslint/typedef
export const scheduledFareCodec = ioType({
  client: ioString,
  creator: ioString,
  date: ioString,
  departure: ioString,
  destination: ioString,
  distance: ioNumber,
  planning: ioString,
  duration: ioNumber,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  kind: ioKeyof({ 'one-way': null, outward: null, 'go-back': null }),
  nature: ioKeyof({ medical: null, standard: null }),
  phone: ioString,
  status: ioLiteral('scheduled'),
  time: ioString
});

export type FareToScheduleTransfer = TypeOf<typeof fareToScheduleTransferCodec>;
export type FareToSchedule = TypeOf<typeof fareToScheduleCodec>;
export type ScheduledFare = TypeOf<typeof scheduledFareCodec>;
export type ScheduledFares = ScheduledFare[];

export type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: FareToScheduleTransfer;
}>;
