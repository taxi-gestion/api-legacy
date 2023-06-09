import { Errors } from 'io-ts';
import { Either, fold as foldEither } from 'fp-ts/Either';
import { AddFareToPlanningTransfer, FareDraft } from './add-fare-to-planning.provider';
import { addFareToPlanningGateway } from './add-fare-to-planning.gateway';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';

describe('Add Fare To Planning gateway tests', (): void => {
  const valid: AddFareToPlanningTransfer = {
    clientIdentity: 'romain',
    clientPhone: '0684319514',
    date: '2023-06-06T00:00:00.000Z',
    driveFrom: 'Location A',
    driveKind: 'one-way',
    driveNature: 'medical',
    planning: 'unassigned',
    driveTo: 'Location B',
    startTime: 'T10:00'
  };

  const missingPlanning: AddFareToPlanningTransfer = {
    ...valid,
    planning: undefined
  } as unknown as AddFareToPlanningTransfer;

  const clientNotRegistered: AddFareToPlanningTransfer = {
    ...valid,
    clientIdentity: 'JohnDoe'
  } as unknown as AddFareToPlanningTransfer;

  const invalidPhone: AddFareToPlanningTransfer = {
    ...valid,
    clientPhone: '+3368431955555555'
  };

  const validFareDraft: FareDraft = {
    client: 'romain',
    date: iso8601DateString('2023-06-06'),
    planning: 'unassigned',
    departure: 'Location A',
    kind: 'one-way',
    nature: 'medical',
    phone: '0684319514',
    status: 'draft',
    time: 'T10:00',
    destination: 'Location B'
  };

  it.each([
    [
      missingPlanning,
      [{ humanReadable: 'Typecheck failed for input', inputKey: 'planning', inputValue: 'undefined', failingRule: 'string' }]
    ],
    [
      clientNotRegistered,
      [
        {
          failingRule: 'isRegisteredClient',
          inputValue: 'JohnDoe',
          inputKey: 'client',
          humanReadable: "Rulecheck failed, 'JohnDoe' is not included in the registered users list"
        }
      ]
    ],
    [
      invalidPhone,
      [
        {
          failingRule: 'isFrenchPhoneNumber',
          inputValue: '+3368431955555555',
          inputKey: 'phone',
          humanReadable: `Rulecheck failed, '+3368431955555555' is not a valid french phone number that match '/^(?:(?:\\+|00)33|0)[1-9]\\d{8}$/gu' regex`
        }
      ]
    ],
    [valid, validFareDraft]
  ])(
    'should return %s when the transfer request payload is %s',
    (payload: unknown, expectedValue: DevFriendlyError[] | FareDraft): void => {
      const either: Either<Errors, FareDraft> = addFareToPlanningGateway(payload);
      foldEither(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: FareDraft): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
