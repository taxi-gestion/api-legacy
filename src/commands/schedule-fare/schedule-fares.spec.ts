import { Errors } from 'io-ts';
import { Either, fold as foldEither, right as rightEither } from 'fp-ts/Either';
import { scheduleFares } from './schedule-fares';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { ReturnToAffect, ToSchedule, Scheduled, Place } from '../../definitions';

const placeCanuts: Place = {
  context: '17 Avenue des Canuts, 69120',
  label: '17 Avenue des Canuts, 69120',
  location: {
    latitude: 0,
    longitude: 0
  }
};

const placeAqueducs: Place = {
  context: '61 rue des Aqueducs, 69005',
  label: '61 rue des Aqueducs, 69005',
  location: {
    latitude: 0,
    longitude: 0
  }
};

describe('Add Fare To Planning use case tests', (): void => {
  const fareToScheduleOneWay: ToSchedule = {
    planning: 'driver@taxi-gestion.com',
    client: 'Bob',
    datetime: '2019-05-05T08:00:00.000Z',
    departure: placeCanuts,
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'to-schedule',
    destination: placeAqueducs,
    duration: 1613,
    distance: 17314
  };

  const fareToScheduleTwoWay: ToSchedule = {
    planning: 'driver@taxi-gestion.com',
    client: 'Bob',
    datetime: '2019-05-05T08:00:00.000Z',
    departure: placeCanuts,
    kind: 'outward',
    nature: 'medical',
    phone: '+33684319514',
    status: 'to-schedule',
    destination: placeAqueducs,
    duration: 1613,
    distance: 17314
  };

  const expectedOneWay: [Scheduled] = [
    {
      planning: 'driver@taxi-gestion.com',
      client: 'Bob',
      datetime: '2019-05-05T08:00:00.000Z',
      departure: placeCanuts,
      kind: 'one-way',
      nature: 'medical',
      phone: '+33684319514',
      status: 'scheduled',
      destination: placeAqueducs,
      duration: 1613,
      distance: 17314,
      creator: 'romain.cambonie@gmail.com'
    }
  ];

  const expectedTwoWay: [Scheduled, ReturnToAffect] = [
    {
      planning: 'driver@taxi-gestion.com',
      client: 'Bob',
      datetime: '2019-05-05T08:00:00.000Z',
      departure: placeCanuts,
      kind: 'outward',
      nature: 'medical',
      phone: '+33684319514',
      status: 'scheduled',
      destination: placeAqueducs,
      duration: 1613,
      distance: 17314,
      creator: 'romain.cambonie@gmail.com'
    },
    {
      planning: 'driver@taxi-gestion.com',
      client: 'Bob',
      datetime: '2019-05-05T00:00:00.000Z',
      departure: placeAqueducs,
      kind: 'return',
      nature: 'medical',
      phone: '+33684319514',
      status: 'return-to-affect',
      destination: placeCanuts
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
