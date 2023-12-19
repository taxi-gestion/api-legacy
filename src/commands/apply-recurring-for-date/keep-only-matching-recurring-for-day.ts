import { Entity, Recurring } from '../../definitions';
import { of as taskEitherOf, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../codecs';
import { RRule } from 'rrule';

export const keepOnlyMatchingRecurringForDay = ([date, recurringFares]: [string, (Entity & Recurring)[]]): TaskEither<
  Errors,
  [string, (Entity & Recurring)[]]
> => taskEitherOf([date, recurringMatchDate(date, recurringFares)]);
const recurringMatchDate = (date: string, recurringFares: (Entity & Recurring)[]): (Entity & Recurring)[] =>
  recurringFares.filter((recurring: Entity & Recurring): boolean => matchDateString(date)(recurring.recurrence));
export const matchDateString =
  (dateString: string) =>
  (recurrenceRule: string): boolean =>
    RRule.fromString(recurrenceRule).between(new Date(dateString), new Date(dateString), true).length === 1;
