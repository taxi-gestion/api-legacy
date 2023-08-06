import { Place } from './place.definition';
export type Entity = { id: string };
export type ReturnToDelete = { idToDelete: string };

export type Drive = {
  departure: Place;
  destination: Place;
  datetime: string;
  driver: string;
};

export type DurationDistance = {
  duration: number;
  distance: number;
};

export type Passenger = {
  passenger: string;
  phone: string;
};

export type FareToSchedule = Drive &
  DurationDistance &
  Passenger & {
    kind: 'one-way' | 'two-way';
    nature: 'medical' | 'standard';
    status: 'to-schedule';
  };

export type ReturnToSchedule = Drive &
  DurationDistance &
  Passenger & {
    nature: 'medical' | 'standard';
    kind: 'two-way';
    status: 'return-to-schedule';
  };

export type Pending = Drive &
  Passenger & {
    nature: 'medical' | 'standard';
    kind: 'two-way';
    status: 'pending-return';
  };

export type Scheduled = Drive &
  DurationDistance &
  Passenger & {
    kind: 'one-way' | 'two-way';
    nature: 'medical' | 'standard';
    status: 'scheduled';
  };
