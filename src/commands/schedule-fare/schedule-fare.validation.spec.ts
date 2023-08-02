import { Errors } from 'io-ts';
import { Either, fold as eitherFold } from 'fp-ts/Either';
import { scheduleFareValidation } from './schedule-fare.validation';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';
import { FareToScheduleTransfer } from './schedule-fare.codec';
import { ToSchedule } from '../../definitions';

describe('Add Fare To Planning gateway tests', (): void => {
  const valid: FareToScheduleTransfer = {
    clientIdentity: 'romain',
    clientPhone: '0684319514',
    datetime: '2023-06-06T00:00:00.000Z',
    driveFrom: {
      context: 'Location A',
      label: 'Location A',
      location: {
        latitude: 0,
        longitude: 0
      }
    },
    driveKind: 'one-way',
    driveNature: 'medical',
    planning: 'unassigned',
    driveTo: {
      context: 'Location B',
      label: 'Location B',
      location: {
        latitude: 0,
        longitude: 0
      }
    },
    duration: 1613,
    distance: 17314,
    recurrence: undefined
  };

  const missingPlanning: FareToScheduleTransfer = {
    ...valid,
    planning: undefined
  } as unknown as FareToScheduleTransfer;

  const invalidPhone: FareToScheduleTransfer = {
    ...valid,
    clientPhone: '+3368431955555555'
  };

  const validFareDraft: ToSchedule = {
    client: 'romain',
    datetime: '2023-06-06T00:00:00.000Z',
    planning: 'unassigned',
    departure: {
      context: 'Location A',
      label: 'Location A',
      location: {
        latitude: 0,
        longitude: 0
      }
    },
    kind: 'one-way',
    nature: 'medical',
    phone: '0684319514',
    status: 'to-schedule',
    destination: {
      context: 'Location B',
      label: 'Location B',
      location: {
        latitude: 0,
        longitude: 0
      }
    },
    duration: 1613,
    distance: 17314
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
    (payload: unknown, expectedValue: DevFriendlyError[] | ToSchedule): void => {
      const either: Either<Errors, ToSchedule> = scheduleFareValidation(payload);
      eitherFold(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: ToSchedule): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
