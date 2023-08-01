import { Place } from './place.definition';

export type Fare = {
  client: string;
  date: string;
  departure: Place;
  destination: Place;
  phone: string;
  kind: 'one-way' | 'outward' | 'return';
  nature: 'medical' | 'standard';
};

export type ToSchedule = Fare & {
  planning: string;
  status: 'to-schedule';
  time: string;
  duration: number;
  distance: number;
};

export type ReturnToAffect = Fare & {
  kind: 'return';
  planning: string | undefined;
  status: 'return-to-affect';
  time: string | undefined;
};

export type Scheduled = Fare & {
  planning: string;
  status: 'scheduled';
  time: string;
  creator: string;
  duration: number;
  distance: number;
};
