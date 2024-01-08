import { describe, it, expect } from 'vitest';
import { toUTCDateString } from './to-utc-date';

describe('convertToUTC', (): void => {
  it('should convert zoned time to UTC', (): void => {
    const zonedDateString: string = '2024-01-08T06:50'; // Example for New York timezone
    const timeZone: string = 'Europe/Paris';
    const utcDate: string = toUTCDateString(zonedDateString, timeZone);

    expect(utcDate).toBe('2024-01-08T05:50:00.000Z');
  });

  it('should convert zoned time to UTC', (): void => {
    const zonedDateString: string = '2024-01-08T08:00'; // Example for New York timezone
    const timeZone: string = 'Europe/Paris';
    const utcDate: string = toUTCDateString(zonedDateString, timeZone);

    expect(utcDate).toStrictEqual('2024-01-08T07:00:00.000Z');
  });

  // Additional test cases can be added here
});
