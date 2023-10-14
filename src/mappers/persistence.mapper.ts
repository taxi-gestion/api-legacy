import {
  Entity,
  Pending,
  PendingPersistence,
  Regular,
  RegularPersistence,
  Scheduled,
  ScheduledPersistence,
  Subcontracted,
  SubcontractedPersistence
} from '../definitions';

export const fromDBtoSubcontractedCandidate = (row: Entity & SubcontractedPersistence): unknown =>
  ({
    id: row.id,
    subcontractor: row.subcontractor,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    arrival: row.arrival,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    status: 'subcontracted'
  } satisfies Entity & Subcontracted);

export const fromDBtoScheduledCandidate = (row: Entity & ScheduledPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    arrival: row.arrival,
    driver: row.driver,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    status: 'scheduled'
  } satisfies Entity & Scheduled);

export const fromDBtoPendingCandidate = (row: Entity & PendingPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    arrival: row.arrival,
    driver: row.driver,
    kind: row.kind,
    nature: row.nature,
    status: 'pending-return'
  } satisfies Entity & Pending);

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
