import { FareDraft, FareReady } from './add-fare-to-planning.provider';
import { addFareToPlanningUseCase } from './add-fare-to-planning.use-case';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { Either, fold, right } from 'fp-ts/Either';
import { Errors } from 'io-ts';

describe('Add Fare To Planning use case tests', (): void => {
  const fareDraft: FareDraft = {
    planning: 'unassigned',
    client: 'Bob',
    date: iso8601DateString('2019-05-05'),
    departure: '17 Avenue des Canuts, 69120',
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'draft',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120'
  };

  const expectedWithHarcodedValues: FareReady = {
    planning: 'unassigned',
    client: 'Bob',
    date: iso8601DateString('2019-05-05'),
    departure: '17 Avenue des Canuts, 69120',
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'ready',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120',
    duration: 20,
    distance: 1000,
    creator: 'romain.cambonie@gmail.com'
  };

  it.each([[right(fareDraft), expectedWithHarcodedValues]])(
    'should return %s when the fare draft is %s',
    (payload: Either<Errors, FareDraft>, expectedValue: DevFriendlyError[] | FareReady): void => {
      const either: Either<Errors, FareReady> = addFareToPlanningUseCase(payload);
      fold(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: FareReady): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
