export type Fare = {
  client: string;
  date: string;
  departure: string;
  destination: string;
  phone: string;
  kind: 'one-way' | 'outward' | 'return';
  nature: 'medical' | 'standard';
};

export type FareToSchedule = Fare & {
  planning: string;
  status: 'to-schedule';
  time: string;
};

export type FareReturnToSchedule = Fare & {
  kind: 'return';
  planning: string | undefined;
  status: 'to-schedule';
  time: string | undefined;
};

export type ScheduledFare = Fare & {
  planning: string;
  status: 'scheduled';
  time: string;
  distance: number;
  duration: number;
  creator: string;
};
