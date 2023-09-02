import type { Type } from 'io-ts';
import { intersection as ioIntersection, tuple as ioTuple, undefined as ioUndefined, union as ioUnion } from 'io-ts';
import { Entity, ToEdit } from '../../definitions';
import { driveRulesCodec, durationDistanceRulesCodec, entityCodec, passengerRulesCodec } from './traits.codecs';
import { fareToEditCodec, returnDriveCodec, toEditCodec, toScheduleCodec } from './fares.codecs';

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

export const fareToEditAndOptionalPendingReturnEntityRulesCodec: Type<[Entity & ToEdit, Entity?]> = ioTuple([
  fareToEditRulesCodec,
  ioUnion([entityCodec, ioUndefined])
]) as unknown as Type<[Entity & ToEdit, Entity?]>;
