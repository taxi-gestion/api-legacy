import { zonedTimeToUtc } from 'date-fns-tz';

export const toUTCDateString = (zonedDateString: string, timeZone: string): string =>
  zonedTimeToUtc(zonedDateString, timeZone).toISOString();
