import {
  AdapterOperation,
  ConditionOnDomain,
  EncodeToAdapter,
  EncodeToDomain
} from '../../../definitions/strategy.definitions';
import { Driver, Entity, Pending, Recurring, Scheduled } from '../../../definitions';
import { encodeScheduled } from './scheduled.encoder';
import { ScheduledAndPendingPersist } from '../../schedule-fare/schedule-fare.route';
import { PostgresDb } from '@fastify/postgres';
import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../codecs';
import { pipe } from 'fp-ts/function';
import { insertScheduledAndOptionalPersistIn } from '../../schedule-fare/schedule-fare.persistence';
import { Encode } from 'io-ts';
import { toUTCDateString } from '../to-utc-date';

export type RecurringForScheduledAndPending = Recurring & {
  driver: Driver & Entity;
  returnTime: undefined;
};
export const hasScheduledAndPending: ConditionOnDomain<Recurring, RecurringForScheduledAndPending> = (
  recurring: Recurring
): recurring is RecurringForScheduledAndPending =>
  recurring.driver !== undefined && recurring.returnTime === undefined && recurring.kind === 'two-way';

export type ScheduledAndPending = [Scheduled, Pending];

export const encodeScheduledAndPendingPersist = ([scheduled, pending]: ScheduledAndPending): ScheduledAndPendingPersist => ({
  scheduledToCreate: scheduled,
  pendingToCreate: pending
});

export const encodeToScheduledAndPendingPersist: EncodeToAdapter<ScheduledAndPending, ScheduledAndPendingPersist> = (
  fares: ScheduledAndPending
): ScheduledAndPendingPersist => encodeScheduledAndPendingPersist(fares);

export const persistScheduledAndPending =
  (database: PostgresDb): AdapterOperation<ScheduledAndPendingPersist> =>
  (fares: ScheduledAndPendingPersist): TaskEither<Errors, unknown> =>
    pipe(fares, insertScheduledAndOptionalPersistIn(database));

const encodePending: (date: string) => Encode<RecurringForScheduledAndPending, Pending> =
  (date: string) =>
  (recurring: RecurringForScheduledAndPending): Pending => ({
    departure: recurring.arrival,
    arrival: recurring.departure,
    nature: recurring.nature,
    passenger: recurring.passenger,
    kind: 'two-way',
    driver: recurring.driver,
    datetime: toUTCDateString(`${date}T${recurring.departureTime}`, 'Europe/Paris'),
    status: 'pending',
    creator: 'recurrence'
  });
export const encodeToScheduledAndPending =
  (date: string): EncodeToDomain<RecurringForScheduledAndPending, ScheduledAndPending> =>
  (recurring: RecurringForScheduledAndPending): ScheduledAndPending =>
    [encodeScheduled(date)(recurring), encodePending(date)(recurring)];
