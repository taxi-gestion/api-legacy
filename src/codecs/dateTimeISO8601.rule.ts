import { DateFromISOString, withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, Errors, StringC } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { getOrElseW } from 'fp-ts/Either';
import { isEqual, isValid, parseISO } from 'date-fns';
import { TypeOf } from 'io-ts/Decoder';

export const isDateTimeISO8601String: BrandC<StringC, DateTimeISO8601Brand> = withMessage(
  t.brand(
    t.string,
    (dateTime: string): dateTime is t.Branded<string, DateTimeISO8601Brand> =>
      isValidDateTime(dateTime) && (matchMidnightDateTimeISO8601(dateTime) || matchDateTimeISO8601(dateTime)),
    'isDateTimeISO8601'
  ),
  (input: unknown): string =>
    `Rules check failed, '${String(
      input
    )}' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)`
);

export const iso8601DateTimeString = (input: string): string =>
  pipe(
    DateFromISOString.decode(input),
    getOrElseW((_: Errors): never => {
      throw new Error('Invalid DateTime ISO8601 dateTime string representation (YYYY-mm-dd)');
    }),
    (dateTime: Date): string => dateTime.toISOString()
  );

const matchDateTimeISO8601 = (dateTime: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T[0-2][0-3]:[0-5]\d:[0-5]\d\.000Z$/gu.test(dateTime);

const matchMidnightDateTimeISO8601 = (dateTime: string): boolean => /^\d{4}-\d{2}-\d{2}T24:00:00\.000Z$/gu.test(dateTime);

const isValidDateTime = (dateTime: string): boolean => {
  const parsedDateTime: Date = parseISO(dateTime);
  return isValid(parsedDateTime) && isEqual(parsedDateTime, new Date(dateTime));
};

export type DateTimeISO8601 = TypeOf<typeof isDateTimeISO8601String>;

type DateTimeISO8601Brand = {
  readonly isDateTimeISO8601: unique symbol;
};
