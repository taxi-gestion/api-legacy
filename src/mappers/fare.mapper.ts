import { Pending, ToScheduledEdited, ToScheduled } from '../definitions';

export const toPending = (fare: ToScheduled | ToScheduledEdited): Pending => ({
  passenger: fare.passenger,
  datetime: toZeroedTimeIso8601(fare.datetime),
  nature: fare.nature,
  driver: fare.driver,
  departure: fare.arrival,
  arrival: fare.departure,
  status: 'pending',
  kind: 'two-way'
});

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
