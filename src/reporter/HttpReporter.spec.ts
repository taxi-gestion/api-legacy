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

  const infrastructureErrorFromException: InfrastructureError = {
    isInfrastructureError: true,
    code: '503',
    stack: 'no stack available',
    message: `selectFaresForDate database error - Error: connect ECONNREFUSED 127.0.0.1:5432`,
    // eslint-disable-next-line id-denylist
    value: 'Error'
  };

  const simpleError: Either<Errors, unknown> = left<Errors, unknown>([stringError]);
  const singleError: Either<Errors, unknown> = left<Errors, unknown>([validationError1]);
  const multipleErrors: Either<Errors, unknown> = left<Errors, unknown>([validationError1, validationError2]);
  const infrastructureError: Either<Errors, unknown> = left<Errors, unknown>([infrastructureErrorFromException]);

  it.each([
    [
      simpleError,
      [{ humanReadable: 'Type check failed', inputKey: '', errorValue: 'undefined', failingRule: 'string', code: '400' }]
    ],
    [
      singleError,
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
      infrastructureError,
      [
        {
          humanReadable: `A technical dependency of the service is unavailable - selectFaresForDate database error - Error: connect ECONNREFUSED 127.0.0.1:5432`,
          errorValue: 'Error',
          code: '503'
        }
      ]
    ]
  ])('should return %o when errors are %o', (payload: Either<Errors, unknown>, expectedResult: DevFriendlyError[]): void => {
    expect(HttpReporter.report(payload)).toStrictEqual(expectedResult);
  });
});
