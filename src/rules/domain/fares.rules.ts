/* eslint-disable @typescript-eslint/typedef */
import { intersection as ioIntersection } from 'io-ts';
import { driveRulesCodec, durationDistanceRulesCodec } from './traits.rules';
import { fareToEditCodec, returnDriveCodec, toEditCodec, toScheduleCodec } from '../../codecs';

export const toScheduleRulesCodec = ioIntersection(
  [toScheduleCodec, driveRulesCodec, durationDistanceRulesCodec],
  'toScheduleRulesCodec'
);

export const returnDriveRulesCodec = ioIntersection(
  [returnDriveCodec, driveRulesCodec, durationDistanceRulesCodec],
  'returnDriveRulesCodec'
);

export const toEditRulesCodec = ioIntersection([toEditCodec, driveRulesCodec, durationDistanceRulesCodec], 'toEditRulesCodec');

export const fareToEditRulesCodec = ioIntersection(
  [fareToEditCodec, driveRulesCodec, durationDistanceRulesCodec],
  'fareToEditRulesCodec'
);
