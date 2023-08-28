/* eslint-disable max-lines */
import type { Type } from 'io-ts';
import {
  intersection as ioIntersection,
  keyof as ioKeyof,
  literal as ioLiteral,
  undefined as ioUndefined,
  tuple as ioTuple,
  union as ioUnion,
  number as ioNumber,
  string as ioString,
  type as ioType,
  array as ioArray
} from 'io-ts';
import {
  CompletedReturnToSchedule,
  Drive,
  Driver,
  DurationDistance,
  Entity,
  FareToSchedule,
  Passenger,
  Pending,
  Regular,
  ReturnToSchedule,
  Scheduled
} from '../definitions';
import { isDateTimeISO8601String, isFrenchPhoneNumber, isPositive, placeCodec, placeRulesCodec } from './common';

export const entityCodec: Type<Entity> = ioType({
  id: ioString
});

export const entityTupleWithSecondOptionalCodec: Type<[Entity, Entity?]> = ioTuple([
  entityCodec,
  ioUnion([entityCodec, ioUndefined])
]) as unknown as Type<[Entity, Entity?]>;

export const driverCodec: Type<Driver> = ioType({
  identifier: ioString,
  username: ioString
});

const driveCodec: Type<Drive> = ioType({
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec,
  driver: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
const driveRulesCodec = ioType({
  datetime: isDateTimeISO8601String,
  departure: placeRulesCodec,
  destination: placeRulesCodec
});

const durationDistanceCodec: Type<DurationDistance> = ioType({
  duration: ioNumber,
  distance: ioNumber
});

// eslint-disable-next-line @typescript-eslint/typedef
const durationDistanceRulesCodec = ioType({
  duration: isPositive,
  distance: isPositive
});

const passengerCodec: Type<Passenger> = ioType({
  passenger: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
const passengerRulesCodec = ioType({
  phone: isFrenchPhoneNumber
});

export const regularPassengerCodec: Type<Regular> = ioType({
  firstname: ioString,
  lastname: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const regularPassengerRulesCodec = ioIntersection([
  regularPassengerCodec,
  ioType({
    phone: isFrenchPhoneNumber
  })
]);

export const fareToScheduleCodec: Type<FareToSchedule> = ioIntersection([
  driveCodec,
  durationDistanceCodec,
  passengerCodec,
  ioType({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    kind: ioKeyof({ 'one-way': null, 'two-way': null }),
    status: ioLiteral('to-schedule'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToScheduleRulesCodec = ioIntersection([
  fareToScheduleCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);

export const returnToScheduleCodec: Type<Entity & ReturnToSchedule> = ioIntersection([
  driveCodec,
  durationDistanceCodec,
  ioType({
    id: ioString,
    kind: ioLiteral('two-way'),
    status: ioLiteral('return-to-schedule')
  })
]);

export const completedReturnToScheduleCodec: Type<CompletedReturnToSchedule & Entity> = ioIntersection([
  driveCodec,
  durationDistanceCodec,
  passengerCodec,
  ioType({
    id: ioString,
    kind: ioLiteral('two-way'),
    status: ioLiteral('return-to-schedule'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

// eslint-disable-next-line @typescript-eslint/typedef
export const completedReturnToScheduleRulesCodec = ioIntersection([
  completedReturnToScheduleCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);

export const pendingReturnsCodec: Type<(Entity & Pending)[]> = ioArray(
  ioIntersection([
    passengerCodec,
    driveCodec,
    ioType({
      id: ioString,
      kind: ioLiteral('two-way'),
      status: ioLiteral('pending-return'),
      nature: ioKeyof({ medical: null, standard: null })
    })
  ])
);

export const scheduledFaresCodec: Type<(Entity & Scheduled)[]> = ioArray(
  ioIntersection([
    passengerCodec,
    driveCodec,
    durationDistanceCodec,
    ioType({
      id: ioString,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      kind: ioKeyof({ 'one-way': null, 'two-way': null }),
      status: ioLiteral('scheduled'),
      nature: ioKeyof({ medical: null, standard: null })
    })
  ])
);
