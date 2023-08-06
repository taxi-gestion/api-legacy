import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { map as eitherMap, Either } from 'fp-ts/Either';
import { Pending, FareToSchedule, Scheduled } from '../../definitions';

export const scheduleFare = (fareToSchedule: Either<Errors, FareToSchedule>): Either<Errors, [Scheduled, Pending?]> =>
  pipe(
    fareToSchedule,
    eitherMap((fare: FareToSchedule): [Scheduled, Pending?] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const pendingReturn: Pending | null = createPendingOrEmpty(fare);

      const scheduledFare: Scheduled = {
        ...fare,
        status: 'scheduled'
      };

      return pendingReturn == null ? [scheduledFare] : [scheduledFare, pendingReturn];
    })
  );

const createPendingOrEmpty = (fare: FareToSchedule): Pending | null => {
  if (fare.kind === 'one-way') return null;

  return {
    passenger: fare.passenger,
    datetime: toZeroedTimeIso8601(fare.datetime),
    nature: fare.nature,
    phone: fare.phone,
    driver: fare.driver,
    departure: fare.destination,
    destination: fare.departure,
    status: 'pending-return',
    kind: 'two-way'
  };
};

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
