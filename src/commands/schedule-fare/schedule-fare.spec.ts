import { Errors } from 'io-ts';
import { Either, fold as foldEither, right as rightEither } from 'fp-ts/Either';
import { scheduleFare } from './schedule-fare';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { Pending, FareToSchedule, Scheduled, Place } from '../../definitions';

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

describe('Add Fare To driver use case tests', (): void => {
  const fareToScheduleOneWay: FareToSchedule = {
    driver: 'driver@taxi-gestion.com',
    passenger: 'Bob',
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

  const fareToScheduleTwoWay: FareToSchedule = {
    driver: 'driver@taxi-gestion.com',
    passenger: 'Bob',
    datetime: '2019-05-05T08:00:00.000Z',
    departure: placeCanuts,
    kind: 'two-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'to-schedule',
    destination: placeAqueducs,
    duration: 1613,
    distance: 17314
  };

  const expectedOneWay: [Scheduled] = [
    {
      driver: 'driver@taxi-gestion.com',
      passenger: 'Bob',
      datetime: '2019-05-05T08:00:00.000Z',
      departure: placeCanuts,
      kind: 'one-way',
      nature: 'medical',
      phone: '+33684319514',
      status: 'scheduled',
      destination: placeAqueducs,
      duration: 1613,
      distance: 17314
    }
  ];

  const expectedTwoWay: [Scheduled, Pending] = [
    {
      driver: 'driver@taxi-gestion.com',
      passenger: 'Bob',
      datetime: '2019-05-05T08:00:00.000Z',
      departure: placeCanuts,
      kind: 'two-way',
      nature: 'medical',
      phone: '+33684319514',
      status: 'scheduled',
      destination: placeAqueducs,
      duration: 1613,
      distance: 17314
    },
    {
      driver: 'driver@taxi-gestion.com',
      passenger: 'Bob',
      datetime: '2019-05-05T00:00:00.000Z',
      departure: placeAqueducs,
      kind: 'two-way',
      nature: 'medical',
      phone: '+33684319514',
      status: 'pending-return',
      destination: placeCanuts
    }
  ];

  it.each([
    [rightEither(fareToScheduleOneWay), expectedOneWay],
    [rightEither(fareToScheduleTwoWay), expectedTwoWay]
  ])(
    'should return %s when the fare to-schedule is %s',
    (payload: Either<Errors, FareToSchedule>, expectedValue: DevFriendlyError[] | [Scheduled, Pending?]): void => {
      const either: Either<Errors, [Scheduled, Pending?]> = scheduleFare(payload);
      foldEither(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: [Scheduled, Pending?]): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
