/* eslint-disable @typescript-eslint/typedef */
import { intersection as ioIntersection } from 'io-ts';
import { driveRulesCodec, durationDistanceRulesCodec } from './traits.rules';
import { scheduledToEditCodec, returnDriveCodec, toEditCodec, toScheduleCodec, toUnassignedCodec } from '../../codecs';

export const toScheduleRulesCodec = ioIntersection(
  [toScheduleCodec, driveRulesCodec, durationDistanceRulesCodec],
  'toScheduleRulesCodec'
);

export const toUnassignedRulesCodec = ioIntersection(
  [toUnassignedCodec, driveRulesCodec, durationDistanceRulesCodec],
  'toUnassignedRulesCodec'
);

export const returnDriveRulesCodec = ioIntersection(
  [returnDriveCodec, driveRulesCodec, durationDistanceRulesCodec],
  'returnDriveRulesCodec'
);

export const toEditRulesCodec = ioIntersection([toEditCodec, driveRulesCodec, durationDistanceRulesCodec], 'toEditRulesCodec');

export const scheduledToEditRulesCodec = ioIntersection(
  [scheduledToEditCodec, driveRulesCodec, durationDistanceRulesCodec],
  'scheduledToEditRulesCodec'
);
