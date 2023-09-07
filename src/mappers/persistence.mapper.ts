import {
  Entity,
  Pending,
  PendingPersistence,
  Regular,
  RegularDetails,
  RegularDetailsPersistence,
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
    destination: row.destination,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    phone: row.phone,
    status: 'subcontracted'
  } satisfies Entity & Subcontracted);

export const fromDBtoScheduledCandidate = (row: Entity & ScheduledPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    destination: row.destination,
    driver: row.driver,
    distance: Number(row.distance),
    duration: Number(row.duration),
    kind: row.kind,
    nature: row.nature,
    phone: row.phone,
    status: 'scheduled'
  } satisfies Entity & Scheduled);

export const fromDBtoPendingCandidate = (row: Entity & PendingPersistence): unknown =>
  ({
    id: row.id,
    passenger: row.passenger,
    datetime: row.datetime,
    departure: row.departure,
    destination: row.destination,
    driver: row.driver,
    kind: row.kind,
    nature: row.nature,
    phone: row.phone,
    status: 'pending-return'
  } satisfies Entity & Pending);

export const fromDBtoRegularCandidate = (row: Entity & RegularPersistence): unknown =>
  ({
    id: row.id,
    firstname: row.firstname,
    lastname: row.lastname
  } satisfies Entity & Regular);

export const fromDBtoRegularDetailsCandidate = (row: Entity & RegularDetailsPersistence): unknown =>
  ({
    id: row.id,
    civility: row.civility,
    firstname: row.firstname == null ? undefined : row.firstname,
    lastname: row.lastname,
    phones: row.phones == null ? undefined : row.phones,
    home: row.home == null ? undefined : row.home,
    destinations: row.destinations == null ? undefined : row.destinations,
    commentary: row.commentary == null ? undefined : row.commentary,
    subcontractedClient: row.subcontracted_client == null ? undefined : row.subcontracted_client
  } satisfies Entity & RegularDetails);
