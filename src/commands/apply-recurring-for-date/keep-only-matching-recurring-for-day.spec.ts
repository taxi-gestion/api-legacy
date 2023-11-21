import { describe, expect, it } from 'vitest';
import { matchDateString } from './keep-only-matching-recurring-for-day';

describe('matchDateString', (): void => {
  it.each([
    ['2023-04-01', 'DTSTART:20230402T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=SU', false], // Weekly on Sundays, should not match
    ['2023-04-05', 'DTSTART:20230401T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=WE', true] // Weekly on Wednesdays, should match
    // Add more test cases as needed
  ])(
    'should return %p for date %p with recurrence rule %p',
    (dateString: string, recurrenceRule: string, expectedResult: boolean): void => {
      expect(matchDateString(dateString)(recurrenceRule)).toBe(expectedResult);
    }
  );
});
