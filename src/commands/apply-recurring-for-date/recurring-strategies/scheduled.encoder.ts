import { Encode } from 'io-ts';
import { Driver, Entity, Recurring, Scheduled } from '../../../definitions';
import { RecurringForScheduled } from './scheduled-only.strategy';
import { toUTCDateString } from '../to-utc-date';

/*
 * Encoding to 'one-way' kind because we do not want to create a duplicate when assigning this fare.
 * The pending or return has already been created in the logic
 * */
export const encodeScheduled: (date: string) => Encode<RecurringForScheduled, Scheduled> =
  (date: string) =>
  (recurring: Recurring & { driver: Driver & Entity }): Scheduled => ({
    departure: recurring.departure,
    arrival: recurring.arrival,
    distance: recurring.distance,
    duration: recurring.duration,
    nature: recurring.nature,
    passenger: recurring.passenger,
    kind: 'one-way',
    driver: recurring.driver,
    datetime: toUTCDateString(`${date}T${recurring.departureTime}`, 'Europe/Paris'),
    status: 'scheduled',
    creator: 'recurrence'
  });
