import { Place } from './place.definition';

export type Fare = {
  client: string;
  departure: Place;
  destination: Place;
  datetime: string;
  phone: string;
  kind: 'one-way' | 'outward' | 'return';
  nature: 'medical' | 'standard';
};

export type ToSchedule = Fare & {
  planning: string;
  status: 'to-schedule';
  duration: number;
  distance: number;
};

export type ReturnToAffect = Fare & {
  kind: 'return';
  planning: string | undefined;
  status: 'return-to-affect';
};

export type Scheduled = Fare & {
  planning: string;
  status: 'scheduled';
  creator: string;
  duration: number;
  distance: number;
};
