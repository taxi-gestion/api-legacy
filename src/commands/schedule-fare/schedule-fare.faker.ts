import { fakerFR as faker } from '@faker-js/faker';
import { ScheduledFare, ScheduledFares } from './schedule-fare.definitions';
import { FastifyRequest } from 'fastify';

export type FakeFareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export type FakeFaresForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
    count?: number;
  };
}>;

const getRandomTimeWithinWorkDay = (): string => {
  // eslint-disable-next-line @typescript-eslint/prefer-as-const
  const startHour: 7 = 7;
  // eslint-disable-next-line @typescript-eslint/prefer-as-const
  const endHour: 19 = 19;
  const hour: number = faker.number.int({ min: startHour, max: endHour });
  const minute: number = faker.datatype.number({ min: 0, max: 59 });

  return `T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const generateScheduledFare = (date: string): ScheduledFare => {
  const adminChoices: string[] = ['aymeric', 'anais', 'recurrence'];
  const planningChoices: string[] = ['aymeric', 'kevin', 'caroline', 'nathalie', 'sebastien'];
  const clientChoices: string[] = ['romain', 'marc', 'marie'];

  return {
    client: faker.helpers.arrayElement(clientChoices),
    creator: faker.helpers.arrayElement(adminChoices),
    date,
    departure: faker.location.nearbyGPSCoordinate({ origin: [45.76, 4.83], radius: 15, isMetric: true }).toString(),
    destination: faker.location.nearbyGPSCoordinate({ origin: [45.76, 4.83], radius: 15, isMetric: true }).toString(),
    distance: faker.number.int({ min: 1000, max: 25000 }),
    planning: faker.helpers.arrayElement(planningChoices),
    duration: faker.number.int({ min: 5, max: 25 }),
    kind: faker.helpers.arrayElement(['one-way', 'outward', 'return']),
    nature: faker.helpers.arrayElement(['medical', 'standard']),
    phone: faker.phone.number(),
    status: 'scheduled',
    time: getRandomTimeWithinWorkDay()
  };
};

export const generateScheduledFares = (date: string, count: number): ScheduledFares => {
  const fares: ScheduledFares = [];

  for (let i: number = 0; i < count; i++) {
    fares.push(generateScheduledFare(date));
  }

  return fares;
};
