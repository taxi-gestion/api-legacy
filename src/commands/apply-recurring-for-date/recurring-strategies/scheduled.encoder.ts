import { Encode } from 'io-ts';
import { Driver, Entity, Recurring, Scheduled } from '../../../definitions';
import { RecurringForScheduled } from './scheduled-only.strategy';

export const encodeScheduled: (date: string) => Encode<RecurringForScheduled, Scheduled> =
  (date: string) =>
  (recurring: Recurring & { driver: Driver & Entity }): Scheduled => ({
    departure: recurring.departure,
    arrival: recurring.arrival,
    distance: recurring.distance,
    duration: recurring.duration,
    nature: recurring.nature,
    passenger: recurring.passenger,
    kind: recurring.kind,
    driver: recurring.driver,
    datetime: `${date}T${recurring.departureTime}`,
    status: 'scheduled',
    creator: 'recurrence'
  });
