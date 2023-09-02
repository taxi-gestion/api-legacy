import { Pending, Regular, Scheduled, Subcontracted } from '../definitions';

export type ScheduledPersistence = Scheduled;

export type SubcontractedPersistence = Subcontracted;

export type PendingPersistence = Pending & {
  outwardFareId: string;
};

export type RegularPersistence = Regular;
