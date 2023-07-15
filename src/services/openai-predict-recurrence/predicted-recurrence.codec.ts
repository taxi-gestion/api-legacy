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
import { PredictedRecurrence } from '../../definitions/recurrence.definition';
import { CronBrand, isCronString } from '../../rules/Cron.rule';

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
