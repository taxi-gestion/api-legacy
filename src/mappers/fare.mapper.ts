import { Pending, ToEdit, ToSchedule } from '../definitions';

export const toPending = (fare: ToEdit | ToSchedule): Pending => ({
  passenger: fare.passenger,
  datetime: toZeroedTimeIso8601(fare.datetime),
  nature: fare.nature,
  driver: fare.driver,
  departure: fare.destination,
  destination: fare.departure,
  status: 'pending-return',
  kind: 'two-way'
});

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
