/* eslint-disable max-lines */
import type { Type } from 'io-ts';
import {
  array as ioArray,
  intersection as ioIntersection,
  keyof as ioKeyof,
  literal as ioLiteral,
  number as ioNumber,
  string as ioString,
  tuple as ioTuple,
  type as ioType,
  undefined as ioUndefined,
  union as ioUnion
} from 'io-ts';
import {
  CompletedReturnToSchedule,
  Drive,
  Driver,
  DurationDistance,
  Entity,
  FareToEdit,
  FareToSchedule,
  FareToSubcontract,
  Passenger,
  Pending,
  Regular,
  ReturnToSchedule,
  Scheduled,
  Subcontracted
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

export const fareToEditCodec: Type<Entity & FareToEdit> = ioIntersection([
  entityCodec,
  driveCodec,
  durationDistanceCodec,
  passengerCodec,
  ioType({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    kind: ioKeyof({ 'one-way': null, 'two-way': null }),
    status: ioLiteral('to-edit'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToEditRulesCodec = ioIntersection([
  fareToEditCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);

export const pendingReturnCodec: Type<Entity & Pending> = ioIntersection([
  entityCodec,
  passengerCodec,
  driveCodec,
  ioType({
    kind: ioLiteral('two-way'),
    status: ioLiteral('pending-return'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

export const pendingReturnsCodec: Type<(Entity & Pending)[]> = ioArray(pendingReturnCodec);

export const scheduledFareCodec: Type<Entity & Scheduled> = ioIntersection([
  entityCodec,
  passengerCodec,
  driveCodec,
  durationDistanceCodec,
  ioType({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    kind: ioKeyof({ 'one-way': null, 'two-way': null }),
    status: ioLiteral('scheduled'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

export const scheduledFaresCodec: Type<(Entity & Scheduled)[]> = ioArray(scheduledFareCodec);

export const scheduledFareAndOptionalPendingReturnCodec: Type<[Entity & Scheduled, (Entity & Pending)?]> = ioTuple([
  scheduledFareCodec,
  ioUnion([pendingReturnCodec, ioUndefined])
]) as unknown as Type<[Entity & Scheduled, (Entity & Pending)?]>;

export const fareToEditAndOptionalPendingReturnEntityCodec: Type<[Entity & FareToEdit, Entity?]> = ioTuple([
  fareToEditCodec,
  ioUnion([entityCodec, ioUndefined])
]) as unknown as Type<[Entity & FareToEdit, Entity?]>;

export const fareToEditAndOptionalPendingReturnEntityRulesCodec: Type<[Entity & FareToEdit, Entity?]> = ioTuple([
  fareToEditRulesCodec,
  ioUnion([entityCodec, ioUndefined])
]) as unknown as Type<[Entity & FareToEdit, Entity?]>;

// TODO Remove once type Drive has been updated
const driveWithoutDriverCodec: Type<Omit<Drive, 'driver'>> = ioType({
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec
});

export const fareToSubcontractCodec: Type<Entity & FareToSubcontract> = ioIntersection([
  entityCodec,
  ioType({
    subcontractor: ioString,
    status: ioLiteral('to-subcontract')
  })
]);

export const subcontractedFareCodec: Type<Entity & Subcontracted> = ioIntersection([
  entityCodec,
  passengerCodec,
  driveWithoutDriverCodec,
  durationDistanceCodec,
  ioType({
    subcontractor: ioString,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    kind: ioKeyof({ 'one-way': null, 'two-way': null }),
    status: ioLiteral('subcontracted'),
    nature: ioKeyof({ medical: null, standard: null })
  })
]);

export const subcontractedFaresCodec: Type<(Entity & Subcontracted)[]> = ioArray(subcontractedFareCodec);

export const toSubcontractCodec: Type<FareToSubcontract> = ioType({
  subcontractor: ioString,
  status: ioLiteral('to-subcontract')
});
