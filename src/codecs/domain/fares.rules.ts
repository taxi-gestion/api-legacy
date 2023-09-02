/* eslint-disable @typescript-eslint/typedef */
import { intersection as ioIntersection } from 'io-ts';
import { fareToEditCodec, returnDriveCodec, toEditCodec, toScheduleCodec } from './fares.codecs';
import { driveRulesCodec, durationDistanceRulesCodec, passengerRulesCodec } from './traits.rules';

export const toScheduleRulesCodec = ioIntersection([
  toScheduleCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);

export const returnDriveRulesCodec = ioIntersection([returnDriveCodec, driveRulesCodec, durationDistanceRulesCodec]);

export const toEditRulesCodec = ioIntersection([toEditCodec, driveRulesCodec, passengerRulesCodec, durationDistanceRulesCodec]);

export const fareToEditRulesCodec = ioIntersection([
  fareToEditCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);
