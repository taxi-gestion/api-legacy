import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { map as eitherMap, Either } from 'fp-ts/Either';
import { ReturnToAffect, ToSchedule, Scheduled } from '../../definitions';

export const scheduleFares = (fareToschedule: Either<Errors, ToSchedule>): Either<Errors, [Scheduled, ReturnToAffect?]> =>
  pipe(
    fareToschedule,
    eitherMap((fareToSchedule: ToSchedule): [Scheduled, ReturnToAffect?] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fareReturnToSchedule: ReturnToAffect | null = createFareReturnToScheduleOrEmpty(fareToSchedule);

      const scheduledFare: Scheduled = {
        ...fareToSchedule,
        status: 'scheduled',
        creator: 'romain.cambonie@gmail.com'
      };

      return fareReturnToSchedule == null ? [scheduledFare] : [scheduledFare, fareReturnToSchedule];
    })
  );

const createFareReturnToScheduleOrEmpty = (fareToSchedule: ToSchedule): ReturnToAffect | null => {
  if (fareToSchedule.kind === 'one-way') return null;

  return {
    client: fareToSchedule.client,
    datetime: toZeroedTimeIso8601(fareToSchedule.datetime),
    nature: fareToSchedule.nature,
    phone: fareToSchedule.phone,
    planning: fareToSchedule.planning,
    departure: fareToSchedule.destination,
    destination: fareToSchedule.departure,
    status: 'return-to-affect',
    kind: 'return'
  };
};

const toZeroedTimeIso8601 = (datetime: string): string => {
  const date: Date = new Date(datetime);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};
