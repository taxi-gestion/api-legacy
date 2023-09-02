import { number as ioNumber, string as ioString, type as ioType, Type } from 'io-ts';
import { Drive, Driver, DurationDistance, Entity, Passenger } from '../../definitions';
import { isDateTimeISO8601String, isFrenchPhoneNumber, isPositive, placeCodec, placeRulesCodec } from '../common';

export const entityCodec: Type<Entity> = ioType({
  id: ioString
});

export const driverCodec: Type<Driver> = ioType({
  identifier: ioString,
  username: ioString
});

export const driveCodec: Type<Drive> = ioType({
  datetime: ioString,
  departure: placeCodec,
  destination: placeCodec,
  driver: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const driveRulesCodec = ioType({
  datetime: isDateTimeISO8601String,
  departure: placeRulesCodec,
  destination: placeRulesCodec
});

export const durationDistanceCodec: Type<DurationDistance> = ioType({
  duration: ioNumber,
  distance: ioNumber
});

// eslint-disable-next-line @typescript-eslint/typedef
export const durationDistanceRulesCodec = ioType({
  duration: isPositive,
  distance: isPositive
});

export const passengerCodec: Type<Passenger> = ioType({
  passenger: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const passengerRulesCodec = ioType({
  phone: isFrenchPhoneNumber
});
