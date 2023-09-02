import { Entity, Pending, Regular, Scheduled, Subcontracted } from '../definitions';
import {
  PendingPersistence,
  RegularPersistence,
  ScheduledPersistence,
  SubcontractedPersistence
} from './persistence.definitions';

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
    lastname: row.lastname,
    phone: row.phone
  } satisfies Entity & Regular);
