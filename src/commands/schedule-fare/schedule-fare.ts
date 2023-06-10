import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { map as eitherMap, Either } from 'fp-ts/Either';
import { FareToSchedule, ScheduledFare } from './schedule-fare.definitions';

export const scheduleFare = (fareDraft: Either<Errors, FareToSchedule>): Either<Errors, ScheduledFare> =>
  pipe(
    fareDraft,
    eitherMap(
      (fareToSchedule: FareToSchedule): ScheduledFare => ({
        ...fareToSchedule,
        status: 'scheduled',
        duration: 20,
        distance: 1000,
        creator: 'romain.cambonie@gmail.com'
      })
    )
  );
