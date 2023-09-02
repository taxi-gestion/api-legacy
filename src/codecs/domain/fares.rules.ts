import {intersection as ioIntersection} from 'io-ts';
import {driveRulesCodec, durationDistanceRulesCodec, passengerRulesCodec} from './traits.codecs';
import {fareToEditCodec, returnDriveCodec, toEditCodec, toScheduleCodec} from './fares.codecs';

// eslint-disable-next-line @typescript-eslint/typedef
export const toScheduleRulesCodec = ioIntersection([
  toScheduleCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);

// eslint-disable-next-line @typescript-eslint/typedef
export const returnDriveRulesCodec = ioIntersection([returnDriveCodec, driveRulesCodec, durationDistanceRulesCodec]);

// eslint-disable-next-line @typescript-eslint/typedef
export const toEditRulesCodec = ioIntersection([toEditCodec, driveRulesCodec, passengerRulesCodec, durationDistanceRulesCodec]);

// eslint-disable-next-line @typescript-eslint/typedef
export const fareToEditRulesCodec = ioIntersection([
  fareToEditCodec,
  driveRulesCodec,
  passengerRulesCodec,
  durationDistanceRulesCodec
]);
