import { Errors } from 'io-ts';
import { Either, fold as foldEither, right as rightEither } from 'fp-ts/Either';
import { scheduleFares } from './schedule-fares';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { FareReturnToSchedule, FareToSchedule, ScheduledFare } from '../../definitions/fares.definitions';

describe('Add Fare To Planning use case tests', (): void => {
  const fareToScheduleOneWay: FareToSchedule = {
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

  const fareToScheduleTwoWay: FareToSchedule = {
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

  const expectedOneWay: [ScheduledFare] = [
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

  const expectedTwoWay: [ScheduledFare, FareReturnToSchedule] = [
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
      status: 'to-schedule',
      time: undefined,
      destination: '17 Avenue des Canuts, 69120'
    }
  ];

  it.each([
    [rightEither(fareToScheduleOneWay), expectedOneWay],
    [rightEither(fareToScheduleTwoWay), expectedTwoWay]
  ])(
    'should return %s when the fare to-schedule is %s',
    (
      payload: Either<Errors, FareToSchedule>,
      expectedValue: DevFriendlyError[] | [ScheduledFare, FareReturnToSchedule?]
    ): void => {
      const either: Either<Errors, [ScheduledFare, FareReturnToSchedule?]> = scheduleFares(payload);
      foldEither(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: [ScheduledFare, FareReturnToSchedule?]): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
