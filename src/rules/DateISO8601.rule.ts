import { DateFromISOString, withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, Errors, StringC } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { getOrElseW } from 'fp-ts/Either';
import { isEqual, isValid, parseISO } from 'date-fns';

export const isDateISO8601String: BrandC<StringC, DateISO8601Brand> = withMessage(
  t.brand(
    t.string,
    (date: string): date is t.Branded<string, DateISO8601Brand> => matchDateISO8601(date) && isValidDate(date),
    'isDateISO8601'
  ),
  (input: unknown): string =>
    `Rules check failed, '${String(input)}' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)`
);

export const iso8601DateString = (input: string): string =>
  pipe(
    DateFromISOString.decode(input),
    getOrElseW((_: Errors): never => {
      throw new Error('Invalid Date ISO8601 date string representation (YYYY-mm-dd)');
    }),
    (date: Date): string => date.toISOString()
  );

export type DateISO8601 = t.TypeOf<typeof isDateISO8601String>;

const matchDateISO8601 = (date: string): boolean => /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/gu.test(date);

const isValidDate = (date: string): boolean => {
  const parsedDate: Date = parseISO(date);
  return isValid(parsedDate) && isEqual(parsedDate, new Date(date));
};

type DateISO8601Brand = {
  readonly isDateISO8601: unique symbol;
};
