/* eslint-disable @typescript-eslint/typedef */
import { type as ioType } from 'io-ts';
import { isDateTimeISO8601String, isPositive, placeRulesCodec } from '../common';
import { phoneRulesCodec } from './regular.rules';

export const driveRulesCodec = ioType(
  {
    datetime: isDateTimeISO8601String,
    departure: placeRulesCodec,
    destination: placeRulesCodec
  },
  'driveRulesCodec'
);

export const durationDistanceRulesCodec = ioType(
  {
    duration: isPositive,
    distance: isPositive
  },
  'durationDistanceRulesCodec'
);

export const passengerRulesCodec = ioType(
  {
    phone: phoneRulesCodec
  },
  'passengerRulesCodec'
);
