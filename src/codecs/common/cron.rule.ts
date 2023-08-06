import { withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';
import cron from 'cron-validate';
import { registerOptionPreset } from 'cron-validate/lib/option';
import { TypeOf } from 'io-ts/Decoder';

registerOptionPreset('custom', {
  presetId: 'custom',
  useSeconds: false,
  useYears: false,
  useAliases: false, // optional, default to false
  useBlankDay: false,
  allowOnlyOneBlankDayField: false,
  mustHaveBlankDayField: false, // optional, default to false
  useLastDayOfMonth: false, // optional, default to false
  useLastDayOfWeek: false, // optional, default to false
  useNearestWeekday: false, // optional, default to false
  useNthWeekdayOfMonth: true, // optional, default to false
  seconds: {
    minValue: 0,
    maxValue: 59,
    lowerLimit: 0, // optional, default to minValue
    upperLimit: 59 // optional, default to maxValue
  },
  minutes: {
    minValue: 0,
    maxValue: 59,
    lowerLimit: 0, // optional, default to minValue
    upperLimit: 59 // optional, default to maxValue
  },
  hours: {
    minValue: 0,
    maxValue: 23,
    lowerLimit: 0, // optional, default to minValue
    upperLimit: 23 // optional, default to maxValue
  },
  daysOfMonth: {
    minValue: 1,
    maxValue: 31,
    lowerLimit: 1, // optional, default to minValue
    upperLimit: 31 // optional, default to maxValue
  },
  months: {
    minValue: 0,
    maxValue: 12,
    lowerLimit: 0, // optional, default to minValue
    upperLimit: 12 // optional, default to maxValue
  },
  daysOfWeek: {
    minValue: 0,
    maxValue: 6,
    lowerLimit: 0, // optional, default to minValue
    upperLimit: 6 // optional, default to maxValue
  },
  years: {
    minValue: 1970,
    maxValue: 2099,
    lowerLimit: 1970, // optional, default to minValue
    upperLimit: 2099 // optional, default to maxValue
  }
});
export const isCronString: BrandC<StringC, CronBrand> = withMessage(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  t.brand(
    t.string,
    (cronString: string): cronString is t.Branded<string, CronBrand> => cron(cronString, { preset: 'custom' }).isValid(),
    'isCronString'
  ),
  (input: unknown): string =>
    `Rules check failed, '${String(input)}' is not an accepted Cron representation: ${cron(String(input), { preset: 'custom' })
      .getError()
      .toString()}`
);

export type CronBrand = {
  readonly isCronString: unique symbol;
};

export type Cron = TypeOf<typeof isCronString>;
