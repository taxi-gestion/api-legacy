import { Driver, Entity, Recurring, Scheduled } from '../../../definitions';
import {
  AdapterOperation,
  ConditionOnDomain,
  EncodeToAdapter,
  EncodeToDomain
} from '../../../definitions/strategy.definitions';
import { encodeScheduled } from './scheduled.encoder';
import { ScheduledAndReturnPersist } from '../apply-recurring-for-date.route';
import { PostgresDb } from '@fastify/postgres';
import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../codecs';
import { pipe } from 'fp-ts/function';
import { insertScheduledAndReturnPersistIn } from '../../schedule-fare/schedule-fare.persistence';
import { Encode } from 'io-ts';

export type Return = Scheduled;

export type ScheduledAndReturn = [Scheduled, Return];

export type RecurringForScheduledAndReturn = Recurring & {
  driver: Driver & Entity;
  returnTime: string;
};

export const hasScheduledAndReturn: ConditionOnDomain<Recurring, RecurringForScheduledAndReturn> = (
  recurring: Recurring
): recurring is RecurringForScheduledAndReturn => recurring.driver !== undefined && recurring.returnTime !== undefined;

export const encodeToScheduledAndReturn =
  (date: string): EncodeToDomain<RecurringForScheduledAndReturn, ScheduledAndReturn> =>
  (recurring: RecurringForScheduledAndReturn): ScheduledAndReturn =>
    [encodeScheduled(date)(recurring), encodeScheduledReturnTrip(date)(recurring)];

export const encodeToScheduledAndReturnPersist: EncodeToAdapter<ScheduledAndReturn, ScheduledAndReturnPersist> = (
  fares: ScheduledAndReturn
): ScheduledAndReturnPersist => encodeScheduledAndReturnPersist(fares);

export const persistScheduledAndReturn =
  (database: PostgresDb): AdapterOperation<ScheduledAndReturnPersist> =>
  (fares: ScheduledAndReturnPersist): TaskEither<Errors, unknown> =>
    pipe(fares, insertScheduledAndReturnPersistIn(database));

const encodeScheduledReturnTrip: (date: string) => Encode<RecurringForScheduledAndReturn, Scheduled> =
  (date: string) =>
  (recurring: RecurringForScheduledAndReturn): Scheduled => ({
    departure: recurring.arrival,
    arrival: recurring.departure,
    distance: recurring.distance,
    duration: recurring.duration,
    nature: recurring.nature,
    passenger: recurring.passenger,
    kind: recurring.kind,
    driver: recurring.driver,
    datetime: `${date}T${recurring.returnTime}`,
    status: 'scheduled',
    creator: 'recurrence'
  });
export const encodeScheduledAndReturnPersist = ([
  scheduled,
  scheduledReturn
]: ScheduledAndReturn): ScheduledAndReturnPersist => ({
  scheduledToCreate: scheduled,
  scheduledReturnToCreate: scheduledReturn
});
