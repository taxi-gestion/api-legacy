import { FareDraft, FareDraftWithoutRules, FareReadyWithoutRules } from './add-fare-to-planning.provider';
import { addFareToPlanningUseCase } from './add-fare-to-planning.use-case';

describe('Specification tests', (): void => {
  const fareDraft: FareDraftWithoutRules = {
    driver: undefined,
    client: 'Bob',
    date: '2019-05-05',
    departure: '17 Avenue des Canuts, 69120',
    kind: 'one-way',
    nature: 'medical',
    phone: '+33684319514',
    status: 'draft',
    time: '10:00',
    destination: '20 Avenue des Canuts, 69120'
  };

  const expectedWithHarcodedValues: FareReadyWithoutRules = {
    driver: 'unassigned',
    client: 'Bob',
    date: '2019-05-05',
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

  it.each([
    [{} as FareDraftWithoutRules, new Error('FareReady typecheck failure')],
    [fareDraft, expectedWithHarcodedValues]
  ])(
    'should return %s when the transfer request payload is %s',
    (payload: FareDraftWithoutRules, expectedResult: Error | FareReadyWithoutRules): void => {
      expect(addFareToPlanningUseCase(payload as FareDraft)).toStrictEqual(expectedResult);
    }
  );
});
