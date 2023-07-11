import { Errors } from 'io-ts';
import { Either, fold as foldEither, right as rightEither } from 'fp-ts/Either';
import { scheduleFares } from './schedule-fares';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { ReturnToAffect, ToSchedule, Scheduled } from '../../definitions/fares.definitions';

describe('Add Fare To Planning use case tests', (): void => {
  const fareToScheduleOneWay: ToSchedule = {
    planning: 'driver@taxi-gestion.com',
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

  const fareToScheduleTwoWay: ToSchedule = {
    planning: 'driver@taxi-gestion.com',
    client: 'Bob',
    date: iso8601DateString('2019-05-05'),
    departure: '17 Avenue des Canuts, 69120',
    kind: 'outward',
    nature: 'medical',
    phone: '+33684319514',
    status: 'to-schedule',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120'
  };

  const expectedOneWay: [Scheduled] = [
    {
      planning: 'driver@taxi-gestion.com',
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
    }
  ];

  const expectedTwoWay: [Scheduled, ReturnToAffect] = [
    {
      planning: 'driver@taxi-gestion.com',
      client: 'Bob',
      date: iso8601DateString('2019-05-05'),
      departure: '17 Avenue des Canuts, 69120',
      kind: 'outward',
      nature: 'medical',
      phone: '+33684319514',
      status: 'scheduled',
      time: '10:00',
      destination: '20 Avenue des Canuts, 69120',
      duration: 20,
      distance: 1000,
      creator: 'romain.cambonie@gmail.com'
    },
    {
      planning: 'driver@taxi-gestion.com',
      client: 'Bob',
      date: iso8601DateString('2019-05-05'),
      departure: '20 Avenue des Canuts, 69120',
      kind: 'return',
      nature: 'medical',
      phone: '+33684319514',
      status: 'return-to-affect',
      time: undefined,
      destination: '17 Avenue des Canuts, 69120'
    }
  ];

  it.each([
    [rightEither(fareToScheduleOneWay), expectedOneWay],
    [rightEither(fareToScheduleTwoWay), expectedTwoWay]
  ])(
    'should return %s when the fare to-schedule is %s',
    (payload: Either<Errors, ToSchedule>, expectedValue: DevFriendlyError[] | [Scheduled, ReturnToAffect?]): void => {
      const either: Either<Errors, [Scheduled, ReturnToAffect?]> = scheduleFares(payload);
      foldEither(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: [Scheduled, ReturnToAffect?]): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
