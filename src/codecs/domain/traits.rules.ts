/* eslint-disable @typescript-eslint/typedef */
import { type as ioType } from 'io-ts';
import { isDateTimeISO8601String, isFrenchPhoneNumber, isPositive, placeRulesCodec } from '../common';

export const driveRulesCodec = ioType({
  datetime: isDateTimeISO8601String,
  departure: placeRulesCodec,
  destination: placeRulesCodec
});

export const durationDistanceRulesCodec = ioType({
  duration: isPositive,
  distance: isPositive
});

export const passengerRulesCodec = ioType({
  phone: isFrenchPhoneNumber
});
