import { Pending, ToScheduledEdited, ToScheduled, Scheduled, Unassigned } from '../definitions';

export const toPending = (fare: Pending | Scheduled | ToScheduled | ToScheduledEdited | Unassigned): Pending => ({
  passenger: fare.passenger,
  datetime: toZeroedTimeIso8601(fare.datetime),
  nature: fare.nature,
  driver: 'driver' in fare ? fare.driver : undefined,
  departure: fare.arrival,
  arrival: fare.departure,
  status: 'pending',
  kind: 'two-way',
  creator: fare.creator
});

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
