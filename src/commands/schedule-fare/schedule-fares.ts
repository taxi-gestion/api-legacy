import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { map as eitherMap, Either } from 'fp-ts/Either';
import { FareToSchedule, FareReturnToSchedule, ScheduledFare } from './schedule-fare.definitions';

export const scheduleFares = (
  fareToschedule: Either<Errors, FareToSchedule>
): Either<Errors, [ScheduledFare, FareReturnToSchedule?]> =>
  pipe(
    fareToschedule,
    eitherMap((fareToSchedule: FareToSchedule): [ScheduledFare, FareReturnToSchedule?] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fareReturnToSchedule: FareReturnToSchedule | null = createFareReturnToScheduleOrEmpty(fareToSchedule);

      const scheduledFare: ScheduledFare = {
        ...fareToSchedule,
        status: 'scheduled',
        duration: 20,
        distance: 1000,
        creator: 'romain.cambonie@gmail.com'
      };

      return fareReturnToSchedule == null ? [scheduledFare] : [scheduledFare, fareReturnToSchedule];
    })
  );

const createFareReturnToScheduleOrEmpty = (fareToSchedule: FareToSchedule): FareReturnToSchedule | null => {
  if (fareToSchedule.kind === 'one-way') return null;

  return {
    ...fareToSchedule,
    departure: fareToSchedule.destination,
    destination: fareToSchedule.departure,
    creator: 'romain.cambonie@gmail.com',
    status: 'to-schedule',
    time: undefined,
    kind: 'return',
    distance: 1000,
    duration: 20
  };
};
