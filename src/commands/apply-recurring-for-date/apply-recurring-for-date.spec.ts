import {
  Driver,
  Entity,
  Kind,
  Nature,
  Passenger,
  Pending,
  Recurring,
  Scheduled,
  Unassigned,
  Waypoint
} from '../../definitions';
import { recurringStrategies, RecurringStrategyPipeline } from './recurring-strategies';
import { PostgresDb } from '@fastify/postgres';
import { AdapterOperation, StrategyPipeline } from '../../definitions/strategy.definitions';
import { ScheduledAndPendingPersist, ScheduledPersist } from '../schedule-fare/schedule-fare.route';
import { expect, it, describe } from 'vitest';
import { applyStrategyPipeline } from '../../_common/strategy.pattern';
import { ScheduledAndReturnPersist } from './apply-recurring-for-date.route';
import { UnassignedPersist } from '../allocate-unassigned/allocate-unassigned.route';

describe('apply recurring for date strategies', (): void => {
  describe('assert', (): void => {
    it.each([
      {
        name: 'onlyScheduled',
        domain: oneWayRecurringWithDriver,
        expectedAdapterPayload: onlyScheduled
      },
      {
        name: 'scheduledAndPending',
        domain: twoWayRecurringWithDriver,
        expectedAdapterPayload: scheduledAndPending
      },
      {
        name: 'scheduledAndReturn',
        domain: recurringWithReturnTime,
        expectedAdapterPayload: scheduledAndReturn
      },
      {
        name: 'onlyUnassigned',
        domain: recurringNoDriverOneWay,
        expectedAdapterPayload: onlyUnassignedOneWay
      },
      {
        name: 'onlyUnassigned',
        domain: recurringNoDriverTwoWay,
        expectedAdapterPayload: onlyUnassignedTwoWay
      }
    ])(
      `$name | kind: $domain.kind & driver: $domain.driver & returnTime: $domain.returnTime`,
      ({
        name: _,
        domain,
        expectedAdapterPayload
      }: {
        name: string;
        domain: Recurring;
        expectedAdapterPayload: ScheduledAndPendingPersist | ScheduledAndReturnPersist | ScheduledPersist | UnassignedPersist;
      }): void => {
        const result: ScheduledPersist = applyStrategyPipeline<Recurring>(strategies as StrategyPipeline<Recurring>[])([
          domain
        ]) as unknown as ScheduledPersist;
        expect(result).toStrictEqual([expectedAdapterPayload]);
      }
    );

    const adapterOperationMock: AdapterOperation<Recurring> = ((payload: unknown): unknown =>
      payload) as unknown as AdapterOperation<Recurring>;
    const database: PostgresDb = {} as unknown as PostgresDb;
    const strategies: RecurringStrategyPipeline[] = recurringStrategies({ date, database }).map(
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
      ([condition, encodeToDomain, encodeToAdapter, _originalAdapterOperation]) =>
        [condition, encodeToDomain, encodeToAdapter, adapterOperationMock] as unknown as RecurringStrategyPipeline
    );
  });

  const departure: Waypoint = { name: 'Home' } as Waypoint;
  const arrival: Waypoint = { name: 'Destination' } as Waypoint;
  const validDriver: Driver & Entity = { username: 'Roro' } as Driver & Entity;
  const passenger: Entity & Passenger = { firstname: 'Paul ' } as Entity & Passenger;
  const date: string = '2023-11-12';
  const departureTime: string = '11:00';
  const oneWayKind: Kind = 'one-way';
  const returnTime: string = '13:00';
  const twoWayKind: Kind = 'two-way';
  const distance: number = 1;
  const duration: number = 1;
  const nature: Nature = 'medical';

  const oneWayRecurringWithDriver: Entity & Recurring = {
    driver: validDriver,
    kind: oneWayKind,
    status: 'recurring',
    arrival,
    departure,
    departureTime,
    distance,
    duration,
    nature,
    passenger
  } as Entity & Recurring;

  const oneWayWithDriverScheduled: Scheduled = {
    driver: validDriver,
    kind: 'one-way',
    status: 'scheduled',
    datetime: `${date}T${departureTime}`,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const onlyScheduled: ScheduledPersist = {
    scheduledToCreate: oneWayWithDriverScheduled,
    pendingToCreate: undefined
  };

  const twoWayRecurringWithDriver: Entity & Recurring = {
    driver: validDriver,
    kind: twoWayKind,
    status: 'recurring',
    arrival,
    departure,
    departureTime,
    distance,
    duration,
    nature,
    passenger
  } as Entity & Recurring;

  const twoWayWithDriverScheduled: Scheduled = {
    driver: validDriver,
    kind: twoWayKind,
    status: 'scheduled',
    datetime: `${date}T${departureTime}`,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const expectedPending: Pending = {
    driver: validDriver,
    kind: twoWayKind,
    departure: arrival,
    arrival: departure,
    status: 'pending',
    datetime: `${date}T${departureTime}`,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const scheduledAndPending: ScheduledAndPendingPersist = {
    scheduledToCreate: twoWayWithDriverScheduled,
    pendingToCreate: expectedPending
  };

  const recurringWithReturnTime: Entity & Recurring = {
    driver: validDriver,
    kind: twoWayKind,
    departureTime,
    returnTime,
    status: 'recurring',
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger
  } as Entity & Recurring;

  const expectedReturn: Scheduled = {
    driver: validDriver,
    kind: twoWayKind,
    departure: arrival,
    arrival: departure,
    status: 'scheduled',
    datetime: `${date}T${returnTime}`,
    distance,
    duration,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const scheduledAndReturn: ScheduledAndReturnPersist = {
    scheduledToCreate: twoWayWithDriverScheduled,
    scheduledReturnToCreate: expectedReturn
  };

  const recurringNoDriverOneWay: Entity & Recurring = {
    driver: undefined,
    kind: oneWayKind,
    status: 'recurring',
    departureTime,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger
  } as Entity & Recurring;

  const expectedUnassignedOneWay: Unassigned = {
    kind: oneWayKind,
    status: 'unassigned',
    datetime: `${date}T${departureTime}`,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const onlyUnassignedOneWay: UnassignedPersist = {
    unassignedToCreate: expectedUnassignedOneWay
  };

  const recurringNoDriverTwoWay: Entity & Recurring = {
    driver: undefined,
    kind: twoWayKind,
    status: 'recurring',
    departureTime,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger
  } as Entity & Recurring;

  const expectedUnassignedTwoWay: Unassigned = {
    kind: twoWayKind,
    status: 'unassigned',
    datetime: `${date}T${departureTime}`,
    arrival,
    departure,
    distance,
    duration,
    nature,
    passenger,
    creator: 'recurrence'
  };

  const onlyUnassignedTwoWay: UnassignedPersist = {
    unassignedToCreate: expectedUnassignedTwoWay
  };
});
