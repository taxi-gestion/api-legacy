import { Errors } from 'io-ts';
import { Either, fold as eitherFold } from 'fp-ts/Either';
import { FareToScheduleTransfer, FareToSchedule } from './schedule-fare.definitions';
import { scheduleFareValidation } from './schedule-fare.validation';
import { iso8601DateString } from '../../rules/DateISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';

describe('Add Fare To Planning gateway tests', (): void => {
  const valid: FareToScheduleTransfer = {
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

  const missingPlanning: FareToScheduleTransfer = {
    ...valid,
    planning: undefined
  } as unknown as FareToScheduleTransfer;

  const clientNotRegistered: FareToScheduleTransfer = {
    ...valid,
    clientIdentity: 'JohnDoe'
  } as unknown as FareToScheduleTransfer;

  const invalidPhone: FareToScheduleTransfer = {
    ...valid,
    clientPhone: '+3368431955555555'
  };

  const validFareDraft: FareToSchedule = {
    client: 'romain',
    date: iso8601DateString('2023-06-06'),
    planning: 'unassigned',
    departure: 'Location A',
    kind: 'one-way',
    nature: 'medical',
    phone: '0684319514',
    status: 'to-schedule',
    time: 'T10:00',
    destination: 'Location B'
  };

  it.each([
    [
      missingPlanning,
      [
        {
          code: '400',
          humanReadable: 'Type check failed',
          inputKey: 'planning',
          errorValue: 'undefined',
          failingRule: 'string'
        }
      ]
    ],
    [
      clientNotRegistered,
      [
        {
          code: '422',
          failingRule: 'isRegisteredClient',
          errorValue: 'JohnDoe',
          inputKey: 'client',
          humanReadable: "Rules check failed, 'JohnDoe' is not included in the registered users list"
        }
      ]
    ],
    [
      invalidPhone,
      [
        {
          code: '422',
          failingRule: 'isFrenchPhoneNumber',
          errorValue: '+3368431955555555',
          inputKey: 'phone',
          humanReadable: `Rules check failed, '+3368431955555555' is not a valid french phone number that match '/^(?:(?:\\+|00)33|0)[1-9]\\d{8}$/gu' regex`
        }
      ]
    ],
    [valid, validFareDraft]
  ])(
    'should return %s when the transfer request payload is %s',
    (payload: unknown, expectedValue: DevFriendlyError[] | FareToSchedule): void => {
      const either: Either<Errors, FareToSchedule> = scheduleFareValidation(payload);
      eitherFold(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: FareToSchedule): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
