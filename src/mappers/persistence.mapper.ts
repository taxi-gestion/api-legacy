/* eslint-disable max-lines */
import {
  Entity,
  FaresCountForDatePersistence,
  Pending,
  PendingPersistence,
  Recurring,
  RecurringPersistence,
  Regular,
  RegularPersistence,
  Scheduled,
  ScheduledPersistence,
  Subcontracted,
  SubcontractedPersistence,
  Unassigned,
  UnassignedPersistence
} from '../definitions';

export const fromDBtoSubcontractedCandidate = (row: Entity & SubcontractedPersistence): unknown =>
  ({
    id: row.id,
    subcontractor: row.subcontractor,
    passenger: row.passenger,
    // TODO Datetime as Date
    datetime: row.datetime.toISOString(),
    departure: row.departure,
    arrival: row.arrival,
    kind: row.kind,
    nature: row.nature,
    status: 'subcontracted'
  } satisfies Entity & Subcontracted);

export const fromDBtoScheduledCandidate = (row: Entity & ScheduledPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    // TODO Datetime as Date
    datetime: row.datetime.toISOString(),
    departure: row.departure,
    arrival: row.arrival,
    driver: row.driver,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    status: 'scheduled',
    creator: row.creator
  } satisfies Entity & Scheduled);

export const fromDBtoPendingCandidate = (row: Entity & PendingPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    // TODO Datetime as Date
    datetime: row.datetime.toISOString(),
    departure: row.departure,
    arrival: row.arrival,
    driver: row.driver == null ? undefined : row.driver,
    kind: row.kind,
    nature: row.nature,
    status: 'pending',
    creator: row.creator
  } satisfies Entity & Pending);

export const fromDBtoUnassignedCandidate = (row: Entity & UnassignedPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    // TODO Datetime as Date
    datetime: row.datetime.toISOString(),
    departure: row.departure,
    arrival: row.arrival,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    status: 'unassigned',
    creator: row.creator
  } satisfies Entity & Unassigned);

export const fromDBtoRecurringCandidate = (row: Entity & RecurringPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    departureTime: row.departure_time,
    returnTime: row.return_time == null ? undefined : row.return_time,
    departure: row.departure,
    arrival: row.arrival,
    distance: Number(row.distance),
    duration: Number(row.duration),
    driver: row.driver == null ? undefined : row.driver,
    kind: row.kind,
    nature: row.nature,
    recurrence: row.recurrence,
    status: 'recurring'
  } satisfies Entity & Recurring);

export const fromDBtoRegularCandidate = (row: Entity & RegularPersistence): unknown =>
  ({
    id: row.id,
    civility: row.civility,
    firstname: row.firstname == null ? undefined : row.firstname,
    lastname: row.lastname,
    phones: row.phones == null ? undefined : row.phones,
    waypoints: row.waypoints == null ? undefined : row.waypoints,
    comment: row.comment == null ? undefined : row.comment,
    subcontractedClient: row.subcontracted_client == null ? undefined : row.subcontracted_client
  } satisfies Entity & Regular);

export const fromDBtoFaresCountForDateCandidate = (row: FaresCountForDatePersistence): unknown => ({
  scheduled: Number(row.scheduled),
  pending: Number(row.pending),
  subcontracted: Number(row.subcontracted),
  unassigned: Number(row.unassigned)
});

export const toScheduledPersistence = (scheduled: Scheduled): ScheduledPersistence => ({
  passenger: scheduled.passenger,
  // TODO Datetime as Date in Scheduled
  datetime: new Date(scheduled.datetime),
  departure: scheduled.departure,
  arrival: scheduled.arrival,
  driver: scheduled.driver,
  distance: scheduled.distance,
  duration: scheduled.duration,
  kind: scheduled.kind,
  nature: scheduled.nature,
  creator: scheduled.creator
});

export const toScheduledEntityPersistence = (scheduled: Entity & Scheduled): Entity & ScheduledPersistence => ({
  id: scheduled.id,
  ...toScheduledPersistence(scheduled)
});

export const toPendingPersistence = (pending: Pending & { outwardFareId: string }): PendingPersistence => ({
  passenger: pending.passenger,
  // TODO Datetime as Date in Pending
  datetime: new Date(pending.datetime),
  departure: pending.departure,
  arrival: pending.arrival,
  driver: pending.driver,
  kind: pending.kind,
  nature: pending.nature,
  outwardFareId: pending.outwardFareId,
  creator: pending.creator
});

export const toSubcontractedPersistence = (subcontracted: Subcontracted): SubcontractedPersistence => ({
  passenger: subcontracted.passenger,
  // TODO Datetime as Date in Pending
  datetime: new Date(subcontracted.datetime),
  departure: subcontracted.departure,
  arrival: subcontracted.arrival,
  subcontractor: subcontracted.subcontractor,
  kind: subcontracted.kind,
  nature: subcontracted.nature
});

export const toUnassignedPersistence = (unassigned: Unassigned): UnassignedPersistence => ({
  passenger: unassigned.passenger,
  // TODO Datetime as Date in Unassigned
  datetime: new Date(unassigned.datetime),
  departure: unassigned.departure,
  arrival: unassigned.arrival,
  distance: unassigned.distance,
  duration: unassigned.duration,
  kind: unassigned.kind,
  nature: unassigned.nature,
  creator: unassigned.creator
});

/* eslint-disable @typescript-eslint/naming-convention */
export const toRecurringPersistence = (recurring: Recurring): RecurringPersistence => ({
  passenger: recurring.passenger,
  departure_time: recurring.departureTime,
  return_time: recurring.returnTime,
  driver: recurring.driver,
  departure: recurring.departure,
  arrival: recurring.arrival,
  distance: recurring.distance,
  duration: recurring.duration,
  kind: recurring.kind,
  nature: recurring.nature,
  recurrence: recurring.recurrence
});
/* eslint-enable @typescript-eslint/naming-convention */
