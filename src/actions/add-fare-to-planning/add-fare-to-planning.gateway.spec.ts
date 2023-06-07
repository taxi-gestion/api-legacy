import { addFareToPlanningGateway } from './add-fare-to-planning.gateway';
import { AddFareToPlanningTransfer, FareDraftWithoutRules } from './add-fare-to-planning.provider';

describe('Specification tests', (): void => {
  const validTransfer: AddFareToPlanningTransfer = {
    clientIdentity: 'JohnDoe',
    clientPhone: '0684319514',
    date: '2023-06-06',
    driveFrom: 'Location A',
    driveKind: 'one-way',
    driveNature: 'medical',
    planning: 'unassigned',
    driveTo: 'Location B',
    startTime: '10:00'
  };

  const invalidPhone: AddFareToPlanningTransfer = {
    ...validTransfer,
    clientPhone: '+3368431955555555'
  };

  const expectedFareDraft: FareDraftWithoutRules = {
    client: 'JohnDoe',
    date: '2023-06-06',
    planning: 'unassigned',
    departure: 'Location A',
    kind: 'one-way',
    nature: 'medical',
    phone: '0684319514',
    status: 'draft',
    time: '10:00',
    destination: 'Location B'
  };

  it.each([
    [{}, new Error('Transfer typecheck failed')],
    [{ clientIdentity: 'JohnDoe' }, new Error('Transfer typecheck failed')],
    [invalidPhone, new Error('Domain rulesCheck failed')],
    [validTransfer, expectedFareDraft]
  ])(
    'should return %s when the transfer request payload is %s',
    (payload: unknown, expectedResult: Error | FareDraftWithoutRules): void => {
      expect(addFareToPlanningGateway(payload)).toStrictEqual(expectedResult);
    }
  );
});
