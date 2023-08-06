import { Validation } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/Either';
import { isTimeISO8601String, TimeISO8601 } from './timeISO8601.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/HttpReporter';

describe('isDateISO8601 specification tests', (): void => {
  it.each([
    [
      'T00:0',
      [
        {
          code: '422',
          failingRule: 'isTimeISO8601',
          errorValue: 'T00:0',
          inputKey: '',
          humanReadable:
            "Rules check failed, 'T00:0' is not a valid Time ISO8601 extended format string representation (Thh:mm)"
        }
      ]
    ],
    ['T00:00', 'T00:00'],
    ['T24:00', 'T24:00'], //As of ISO 8601-1:2019/Amd 1:2022, midnight may be referred to as "00:00:00", or "24:00:00"
    [
      'T24:01',
      [
        {
          code: '422',
          failingRule: 'isTimeISO8601',
          errorValue: 'T24:01',
          inputKey: '',
          humanReadable:
            "Rules check failed, 'T24:01' is not a valid Time ISO8601 extended format string representation (Thh:mm)"
        }
      ]
    ],
    [
      'T25:00',
      [
        {
          code: '422',
          failingRule: 'isTimeISO8601',
          errorValue: 'T25:00',
          inputKey: '',
          humanReadable:
            "Rules check failed, 'T25:00' is not a valid Time ISO8601 extended format string representation (Thh:mm)"
        }
      ]
    ]
  ])("when the time is '%s' return '%o'", (payload: unknown, expectedResult: DevFriendlyError[] | string): void => {
    expect(
      pipe(isTimeISO8601String.decode(payload), (validation: Validation<TimeISO8601>): DevFriendlyError[] | string =>
        fold(
          (): DevFriendlyError[] | string => HttpReporter.report(validation),
          (right: string): string => right
        )(validation)
      )
    ).toStrictEqual(expectedResult);
  });
});
