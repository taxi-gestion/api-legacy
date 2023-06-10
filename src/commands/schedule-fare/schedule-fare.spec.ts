import { Errors } from 'io-ts';
import { Either, fold as foldEither, right as rightEither } from 'fp-ts/Either';
import { scheduleFare } from './schedule-fare';
import { FareToSchedule, ScheduledFare } from './schedule-fare.definitions';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';

describe('Add Fare To Planning use case tests', (): void => {
  const fareDraft: FareToSchedule = {
    planning: 'unassigned',
    client: 'Bob',
    date: iso8601DateString('2019-05-05'),
    departure: '17 Avenue des Canuts, 69120',
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'to-schedule',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120'
  };

  const expectedWithHarcodedValues: ScheduledFare = {
    planning: 'unassigned',
    client: 'Bob',
    date: iso8601DateString('2019-05-05'),
    departure: '17 Avenue des Canuts, 69120',
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'scheduled',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120',
    duration: 20,
    distance: 1000,
    creator: 'romain.cambonie@gmail.com'
  };

  it.each([[rightEither(fareDraft), expectedWithHarcodedValues]])(
    'should return %s when the fare to-schedule is %s',
    (payload: Either<Errors, FareToSchedule>, expectedValue: DevFriendlyError[] | ScheduledFare): void => {
      const either: Either<Errors, ScheduledFare> = scheduleFare(payload);
      foldEither(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: ScheduledFare): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
