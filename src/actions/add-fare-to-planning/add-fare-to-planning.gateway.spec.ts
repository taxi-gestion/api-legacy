import { addFareToPlanningGateway } from './add-fare-to-planning.gateway';
import { AddFareToPlanningTransfer, FareDraftWithoutRules } from './add-fare-to-planning.provider';
import { Errors } from 'io-ts';
import { Either, fold } from 'fp-ts/Either';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';

describe('Specification tests', (): void => {
  describe('right', (): void => {
    const valid: AddFareToPlanningTransfer = {
      clientIdentity: 'romain',
      clientPhone: '0684319514',
      date: '2023-06-06',
      driveFrom: 'Location A',
      driveKind: 'one-way',
      driveNature: 'medical',
      planning: 'unassigned',
      driveTo: 'Location B',
      startTime: '10:00'
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

    const validFareDraft: FareDraftWithoutRules = {
      client: 'romain',
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
      (payload: unknown, expectedValue: DevFriendlyError[] | FareDraftWithoutRules): void => {
        const either: Either<Errors, FareDraftWithoutRules> = addFareToPlanningGateway(payload);
        fold(
          (): void => {
            expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
          },
          (value: FareDraftWithoutRules): void => expect(value).toStrictEqual(expectedValue)
        )(either);
        //expect(addFareToPlanningGateway(payload)).toStrictEqual(expectedResult);
      }
    );
  });
});
