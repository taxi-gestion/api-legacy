import { Decoder, Errors, ValidationError } from 'io-ts';
import { Either, left } from 'fp-ts/Either';
import HttpReporter, { DevFriendlyError } from './HttpReporter';

describe('Specification tests', (): void => {
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
    message: '',
    // eslint-disable-next-line id-denylist
    value: undefined
  };

  const validationError1: ValidationError = {
      context: [
          {
              actual: undefined,
              key: "clientIdentity",
              type: {
                  name: "isRegisteredUser"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as Decoder<any, any>
          }
      ],
      message: `'Julien' is not included in the registered users list`,
      value: 'Julien'
  }

  const validationError2: ValidationError = {
      context: [
          {
              actual: undefined,
              key: "",
              type: {
                  name: "string"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as Decoder<any, any>
          }
      ],
      message: '',
      // eslint-disable-next-line id-denylist
      value: undefined
  }

  const simpleError: Either<Errors, unknown> = left<Errors, unknown>([stringError]);

  const singleError: Either<Errors, unknown> = left<Errors, unknown>([
      validationError1
  ]);

  const multipleErrors: Either<Errors, unknown> = left<Errors, unknown>([
      validationError1,
      validationError2,
  ]);

  it.each([
    [simpleError, [{ humanReadable: '', inputKey: '', inputValue: 'undefined', failingRule: 'string' }]],
    [singleError, [{humanReadable: `'Julien' is not included in the registered users list`, inputKey: "clientIdentity", inputValue: "Julien", failingRule: "isRegisteredUser"}]],
    [multipleErrors, [
        {humanReadable: `'Julien' is not included in the registered users list`, inputKey: "clientIdentity", inputValue: "Julien", failingRule: "isRegisteredUser"},
        {humanReadable: "", inputKey: "", inputValue: "undefined", failingRule: "string"},
    ]],
  ])('should return %o when errors are %o', (payload: Either<Errors, unknown>, expectedResult: DevFriendlyError[]): void => {
    expect(HttpReporter.report(payload)).toStrictEqual(expectedResult);
  });
});
