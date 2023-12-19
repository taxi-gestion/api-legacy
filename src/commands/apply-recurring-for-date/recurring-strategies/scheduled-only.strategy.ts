import {
  AdapterOperation,
  ConditionOnDomain,
  EncodeToAdapter,
  EncodeToDomain
} from '../../../definitions/strategy.definitions';
import { Driver, Entity, Recurring, Scheduled } from '../../../definitions';
import { encodeScheduled } from './scheduled.encoder';
import { ScheduledPersist } from '../../schedule-fare/schedule-fare.route';
import { PostgresDb } from '@fastify/postgres';
import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../codecs';
import { pipe } from 'fp-ts/function';
import { insertScheduledAndOptionalPersistIn } from '../../schedule-fare/schedule-fare.persistence';

export type RecurringForScheduled = Recurring & {
  driver: Driver & Entity;
};

export type OneScheduled = [Scheduled];

export const hasScheduledOnlyNext: ConditionOnDomain<Recurring, RecurringForScheduled> = (
  recurring: Recurring
): recurring is RecurringForScheduled => recurring.driver !== undefined && recurring.kind === 'one-way';

export const encodeToOneScheduledNext =
  (date: string): EncodeToDomain<RecurringForScheduled, OneScheduled> =>
  (recurring: RecurringForScheduled): OneScheduled =>
    [encodeScheduled(date)(recurring)];

export const encodeToScheduledPersist: EncodeToAdapter<OneScheduled, ScheduledPersist> = (
  fares: OneScheduled
): ScheduledPersist => encodeScheduledPersist(fares);

export const encodeScheduledPersist = ([scheduled]: OneScheduled): ScheduledPersist => ({
  scheduledToCreate: scheduled,
  pendingToCreate: undefined
});

export const persistSingleScheduled =
  (database: PostgresDb): AdapterOperation<ScheduledPersist> =>
  (fares: ScheduledPersist): TaskEither<Errors, unknown> =>
    pipe(fares, insertScheduledAndOptionalPersistIn(database));
