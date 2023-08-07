import { Decoder, ValidationError } from 'io-ts';
import { Either, left } from 'fp-ts/Either';
import HttpReporter, { DevFriendlyError, Errors, InfrastructureError } from './HttpReporter';

describe('HttpReporter specification tests', (): void => {
  // Define the error message and context
  const stringError: ValidationError = {
    context: [
      {
        actual: undefined,
        key: '',
        type: {
          name: 'string'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as Decoder<any, any>
      }
    ],
    message: 'Type check failed',
    // eslint-disable-next-line id-denylist
    value: undefined
  };

  const validationError1: ValidationError = {
    context: [
      {
        actual: undefined,
        key: 'clientIdentity',
        type: {
          name: 'isRegisteredUser'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as Decoder<any, any>
      }
    ],
    message: `Rules check failed, 'Julien' is not included in the registered users list`,
    value: 'Julien'
  };

  const validationError2: ValidationError = {
    context: [
      {
        actual: undefined,
        key: '',
        type: {
          name: 'string'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as Decoder<any, any>
      }
    ],
    message: 'Type check failed',
    // eslint-disable-next-line id-denylist
    value: undefined
  };

  const serviceUnavailable: InfrastructureError = {
    isInfrastructureError: true,
    code: '503',
    stack: 'no stack available',
    message: `selectFaresForDate database error - Error: connect ECONNREFUSED 127.0.0.1:5432`,
    // eslint-disable-next-line id-denylist
    value: 'Error'
  };

  const internalServerError: InfrastructureError = {
    isInfrastructureError: true,
    code: '500',
    stack: 'no stack available',
    message: `insertFareIn database error - relation "scheduled_fares" does not exist`,
    // eslint-disable-next-line id-denylist
    value: 'Error'
  };

  const simpleErrors: Either<Errors, unknown> = left<Errors, unknown>([stringError]);
  const singleErrors: Either<Errors, unknown> = left<Errors, unknown>([validationError1]);
  const multipleErrors: Either<Errors, unknown> = left<Errors, unknown>([validationError1, validationError2]);
  const serviceUnavailableErrors: Either<Errors, unknown> = left<Errors, unknown>([serviceUnavailable]);
  const infrastructureErrors: Either<Errors, unknown> = left<Errors, unknown>([internalServerError]);

  it.each([
    [
      simpleErrors,
      [{ humanReadable: 'Type check failed', inputKey: '', errorValue: 'undefined', failingRule: 'string', code: '400' }]
    ],
    [
      singleErrors,
      [
        {
          humanReadable: `Rules check failed, 'Julien' is not included in the registered users list`,
          inputKey: 'clientIdentity',
          errorValue: 'Julien',
          failingRule: 'isRegisteredUser',
          code: '422'
        }
      ]
    ],
    [
      multipleErrors,
      [
        {
          humanReadable: `Rules check failed, 'Julien' is not included in the registered users list`,
          inputKey: 'clientIdentity',
          errorValue: 'Julien',
          failingRule: 'isRegisteredUser',
          code: '422'
        },
        { humanReadable: 'Type check failed', inputKey: '', errorValue: 'undefined', failingRule: 'string', code: '400' }
      ]
    ],
    [
      serviceUnavailableErrors,
      [
        {
          humanReadable: `A technical dependency of the service is unavailable - selectFaresForDate database error - Error: connect ECONNREFUSED 127.0.0.1:5432`,
          errorValue: 'Error',
          code: '503'
        }
      ]
    ],
    [
      infrastructureErrors,
      [
        {
          humanReadable: `Internal Server Error - insertFareIn database error - relation "scheduled_fares" does not exist`,
          errorValue: 'Error',
          code: '500'
        }
      ]
    ]
  ])('should return %o when errors are %o', (payload: Either<Errors, unknown>, expectedResult: DevFriendlyError[]): void => {
    expect(HttpReporter.report(payload)).toStrictEqual(expectedResult);
  });
});
