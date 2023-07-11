import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { map as eitherMap, Either } from 'fp-ts/Either';
import { ReturnToAffect, ToSchedule, Scheduled } from '../../definitions/fares.definitions';

export const scheduleFares = (fareToschedule: Either<Errors, ToSchedule>): Either<Errors, [Scheduled, ReturnToAffect?]> =>
  pipe(
    fareToschedule,
    eitherMap((fareToSchedule: ToSchedule): [Scheduled, ReturnToAffect?] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fareReturnToSchedule: ReturnToAffect | null = createFareReturnToScheduleOrEmpty(fareToSchedule);

      const scheduledFare: Scheduled = {
        ...fareToSchedule,
        status: 'scheduled',
        duration: 20,
        distance: 1000,
        creator: 'romain.cambonie@gmail.com'
      };

      return fareReturnToSchedule == null ? [scheduledFare] : [scheduledFare, fareReturnToSchedule];
    })
  );

const createFareReturnToScheduleOrEmpty = (fareToSchedule: ToSchedule): ReturnToAffect | null => {
  if (fareToSchedule.kind === 'one-way') return null;

  return {
    ...fareToSchedule,
    departure: fareToSchedule.destination,
    destination: fareToSchedule.departure,
    status: 'return-to-affect',
    time: undefined,
    kind: 'return'
  };
};
