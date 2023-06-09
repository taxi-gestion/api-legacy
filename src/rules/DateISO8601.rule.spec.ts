import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { Validation } from 'io-ts';
import HttpReporter, { DevFriendlyError } from '../reporter/HttpReporter';
import { DateISO8601, isDateISO8601String } from './DateISO8601.rule';

describe('isDateISO8601 specification tests', (): void => {
  it.each([
    [
      '12-08-1990T00:00:00.000Z',
      [
        {
          failingRule: 'isDateISO8601',
          inputValue: '12-08-1990T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rulecheck failed, '12-08-1990T00:00:00.000Z' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)"
        }
      ]
    ],
    [
      '2022-13-12T00:00:00.000Z',
      [
        {
          failingRule: 'isDateISO8601',
          inputValue: '2022-13-12T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rulecheck failed, '2022-13-12T00:00:00.000Z' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)"
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
          failingRule: 'isDateISO8601',
          inputValue: '2023-02-29T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rulecheck failed, '2023-02-29T00:00:00.000Z' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)"
        }
      ]
    ],
    [
      '2023-04-31T00:00:00.000Z',
      [
        {
          failingRule: 'isDateISO8601',
          inputValue: '2023-04-31T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rulecheck failed, '2023-04-31T00:00:00.000Z' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)"
        }
      ]
    ],
    [
      '2023-06-31T00:00:00.000Z',
      [
        {
          failingRule: 'isDateISO8601',
          inputValue: '2023-06-31T00:00:00.000Z',
          inputKey: '',
          humanReadable:
            "Rulecheck failed, '2023-06-31T00:00:00.000Z' is not a valid UTC Date ISO8601 string representation (YYYY-MM-DDT00:00:00.000Z)"
        }
      ]
    ],
    ['2038-01-20T00:00:00.000Z', '2038-01-20T00:00:00.000Z']
  ])("when the date is '%s' return '%o'", (payload: unknown, expectedResult: DevFriendlyError[] | string): void => {
    expect(
      pipe(isDateISO8601String.decode(payload), (validation: Validation<DateISO8601>): DevFriendlyError[] | string =>
        E.fold(
          (): DevFriendlyError[] | string => HttpReporter.report(validation),
          (right: string): string => right
        )(validation)
      )
    ).toStrictEqual(expectedResult);
  });
});
