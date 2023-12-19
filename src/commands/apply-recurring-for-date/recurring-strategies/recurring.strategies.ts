import { UnassignedPersist } from '../../allocate-unassigned/allocate-unassigned.route';

import { Recurring } from '../../../definitions';
import { PostgresDb } from '@fastify/postgres';

import { StrategyPipeline } from '../../../definitions/strategy.definitions';

import {
  encodeToOneUnassigned,
  encodeToUnassignedPersist,
  hasUnassigned,
  OneUnassigned,
  persistSingleUnassigned,
  RecurringForUnassigned
} from './unassigned.strategy';
import { ScheduledAndPendingPersist, ScheduledPersist } from '../../schedule-fare/schedule-fare.route';
import {
  encodeToOneScheduledNext,
  encodeToScheduledPersist,
  hasScheduledOnlyNext,
  OneScheduled,
  persistSingleScheduled,
  RecurringForScheduled
} from './scheduled-only.strategy';
import {
  encodeToScheduledAndPending,
  encodeToScheduledAndPendingPersist,
  hasScheduledAndPending,
  persistScheduledAndPending,
  RecurringForScheduledAndPending,
  ScheduledAndPending
} from './scheduled-and-pending.strategy';
import { ScheduledAndReturnPersist } from '../apply-recurring-for-date.route';

import {
  encodeToScheduledAndReturn,
  encodeToScheduledAndReturnPersist,
  hasScheduledAndReturn,
  persistScheduledAndReturn,
  RecurringForScheduledAndReturn,
  ScheduledAndReturn
} from './scheduled-and-return.strategy';

export type RecurringStrategyPipeline =
  | ScheduledAndPendingStrategyPipeline
  | ScheduledAndReturnStrategyPipeline
  | ScheduledOnlyStrategyPipeline
  | UnassignedStrategyPipeline;

type ScheduledOnlyStrategyPipeline = StrategyPipeline<Recurring, RecurringForScheduled, OneScheduled, ScheduledPersist>;
type ScheduledAndPendingStrategyPipeline = StrategyPipeline<
  Recurring,
  RecurringForScheduledAndPending,
  ScheduledAndPending,
  ScheduledAndPendingPersist
>;
type ScheduledAndReturnStrategyPipeline = StrategyPipeline<
  Recurring,
  RecurringForScheduledAndReturn,
  ScheduledAndReturn,
  ScheduledAndReturnPersist
>;
type UnassignedStrategyPipeline = StrategyPipeline<Recurring, RecurringForUnassigned, OneUnassigned, UnassignedPersist>;

export const recurringStrategies = (dependencies: { date: string; database: PostgresDb }): RecurringStrategyPipeline[] => [
  scheduledOnlyStrategyPipeline(dependencies),
  scheduledAndPendingStrategyPipeline(dependencies),
  scheduledAndReturnStrategyPipeline(dependencies),
  unassignedStrategyPipeline(dependencies)
];

export const unassignedStrategyPipeline = ({
  date,
  database
}: {
  date: string;
  database: PostgresDb;
}): UnassignedStrategyPipeline => [
  hasUnassigned,
  encodeToOneUnassigned(date),
  encodeToUnassignedPersist,
  persistSingleUnassigned(database)
];

export const scheduledOnlyStrategyPipeline = ({
  date,
  database
}: {
  date: string;
  database: PostgresDb;
}): ScheduledOnlyStrategyPipeline => [
  hasScheduledOnlyNext,
  encodeToOneScheduledNext(date),
  encodeToScheduledPersist,
  persistSingleScheduled(database)
];

export const scheduledAndPendingStrategyPipeline = ({
  date,
  database
}: {
  date: string;
  database: PostgresDb;
}): ScheduledAndPendingStrategyPipeline => [
  hasScheduledAndPending,
  encodeToScheduledAndPending(date),
  encodeToScheduledAndPendingPersist,
  persistScheduledAndPending(database)
];

export const scheduledAndReturnStrategyPipeline = ({
  date,
  database
}: {
  date: string;
  database: PostgresDb;
}): ScheduledAndReturnStrategyPipeline => [
  hasScheduledAndReturn,
  encodeToScheduledAndReturn(date),
  encodeToScheduledAndReturnPersist,
  persistScheduledAndReturn(database)
];
