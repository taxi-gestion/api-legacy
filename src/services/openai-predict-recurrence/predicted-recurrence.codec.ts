import {
  BrandC,
  intersection as ioIntersection,
  IntersectionC,
  string as ioString,
  StringC,
  Type,
  type as ioType,
  TypeC
} from 'io-ts';
import { PredictedRecurrence } from '../../definitions';
import { CronBrand, isCronString } from '../../codecs';

export const predictedRecurrenceCodec: Type<PredictedRecurrence> = ioType({
  query: ioString,
  recurrence: ioString,
  explanation: ioString
});

export const predictedRecurrenceRulesCodec: IntersectionC<
  [Type<PredictedRecurrence>, TypeC<{ recurrence: BrandC<StringC, CronBrand> }>]
> = ioIntersection([
  predictedRecurrenceCodec,
  ioType({
    recurrence: isCronString
  })
]);
