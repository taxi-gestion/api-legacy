import { Validation } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/Either';
import HttpReporter, { DevFriendlyError } from '../reporter/HttpReporter';
import { DateTimeISO8601, isDateTimeISO8601String } from './dateTimeISO8601.rule';

describe('isDateTimeISO8601 specification tests', (): void => {
  it.each([
    //Date checks
    [
      '12-08-1990T00:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '12-08-1990T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '12-08-1990T00:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2022-13-12T00:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2022-13-12T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2022-13-12T00:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    ['2022-12-31T00:00:00.000Z', '2022-12-31T00:00:00.000Z'],
    ['2022-12-30T00:00:00.000Z', '2022-12-30T00:00:00.000Z'],
    ['2024-02-29T00:00:00.000Z', '2024-02-29T00:00:00.000Z'], //valid leap year
    [
      '2023-02-29T00:00:00.000Z',
      [
        //invalid leap year
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2023-02-29T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2023-02-29T00:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2023-04-31T00:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2023-04-31T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2023-04-31T00:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2023-06-31T00:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2023-06-31T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2023-06-31T00:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    ['2038-01-20T00:00:00.000Z', '2038-01-20T00:00:00.000Z'],
    // Time checks
    [
      '2038-01-20T30:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2038-01-20T30:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2038-01-20T30:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2038-01-20T30:00:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2038-01-20T30:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2038-01-20T30:00:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2038-01-20T23:60:00.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2038-01-20T23:60:00.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2038-01-20T23:60:00.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    [
      '2038-01-20T00:00:00.001Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2038-01-20T00:00:00.001Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2038-01-20T00:00:00.001Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ],
    ['2038-01-20T24:00:00.000Z', '2038-01-20T24:00:00.000Z'],
    [
      '2038-01-20T24:00:01.000Z',
      [
        {
          code: '422',
          failingRule: 'isDateTimeISO8601',
          errorValue: '2038-01-20T24:00:01.000Z',
          inputKey: '',
          humanReadable:
            "Rules check failed, '2038-01-20T24:00:01.000Z' is not an accepted UTC DateTime ISO8601 string representation (YYYY-MM-DDTHH:mm:ss.000Z)"
        }
      ]
    ]
  ])("when the dateTime is '%s' return '%o'", (payload: unknown, expectedResult: DevFriendlyError[] | string): void => {
    expect(
      pipe(isDateTimeISO8601String.decode(payload), (validation: Validation<DateTimeISO8601>): DevFriendlyError[] | string =>
        fold(
          (): DevFriendlyError[] | string => HttpReporter.report(validation),
          (right: string): string => right
        )(validation)
      )
    ).toStrictEqual(expectedResult);
  });
});
