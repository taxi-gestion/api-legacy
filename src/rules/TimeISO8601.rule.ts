import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';
import { withMessage } from 'io-ts-types';

export const isTimeISO8601String: BrandC<StringC, TimeISO8601Brand> = withMessage(
  t.brand(
    t.string,
    (time: string): time is t.Branded<string, TimeISO8601Brand> => matchTimeISO8601(time) && isValidTime(time),
    'isTimeISO8601'
  ),
  (input: unknown): string =>
    `Rulecheck failed, '${String(input)}' is not a valid Time ISO8601 extended format string representation (Thh:mm)`
);

export type TimeISO8601 = t.TypeOf<typeof isTimeISO8601String>;

const matchTimeISO8601 = (time: string): boolean => /^T\d{2}:\d{2}$/gu.test(time);

type TimeISO8601Brand = {
  readonly isTimeISO8601: unique symbol;
};

// eslint-disable-next-line complexity
const isValidTime = (time: string): boolean => {
  const [hour, minute]: number[] = time
    .slice(1)
    .split(':')
    .map((part: string): number => Number(part));
  if (hour === 24 && minute === 0) return true; //As of ISO 8601-1:2019/Amd 1:2022, midnight may be referred to as "00:00:00", or "24:00:00"
  return (
    minute != null && hour != null && minute <= 59 && minute >= 0 && !isNaN(minute) && hour <= 23 && hour >= 0 && !isNaN(hour)
  );
};
