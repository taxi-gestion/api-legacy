/* eslint-disable @typescript-eslint/typedef */
import { type as ioType } from 'io-ts';
import { placeRulesCodec } from './place.rule';
import { isPositive } from './positive.rule';
import { isDateTimeISO8601String } from './dateTimeISO8601.rule';

export const journeyEstimateRulesCodec = ioType(
  {
    distanceInMeters: isPositive,
    durationInSeconds: isPositive
  },
  'journeyEstimateRulesCodec'
);

export const journeyRulesCodec = ioType(
  {
    origin: placeRulesCodec,
    destination: placeRulesCodec,
    departureTime: isDateTimeISO8601String
  },
  'journeyRulesCodec'
);
