/* eslint-disable @typescript-eslint/typedef */
import { type as ioType } from 'io-ts';
import { isDateTimeISO8601String, isPositive } from '../common';
import { phoneRulesCodec } from './regular.rules';
import { waypointRulesCodec } from './waypoint.rule';

export const driveRulesCodec = ioType(
  {
    datetime: isDateTimeISO8601String,
    departure: waypointRulesCodec,
    arrival: waypointRulesCodec
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
