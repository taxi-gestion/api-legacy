import { Validation } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/Either';
import { Cron, isCronString } from './cron.rule';
import HttpReporter, { DevFriendlyError } from '../../reporter/http-reporter';

describe('cron specification tests', (): void => {
  it.each([
    [
      '0 0 * *',
      [
        {
          code: '422',
          failingRule: 'isCronString',
          errorValue: '0 0 * *',
          humanReadable: `Rules check failed, '0 0 * *' is not an accepted Cron representation: Expected 5 values, but got 4. (Input cron: '0 0 * *')`
        }
      ]
    ],
    [
      '0 0 * * *#1',
      [
        {
          code: '422',
          failingRule: 'isCronString',
          errorValue: '0 0 * * *#1',
          humanReadable: `Rules check failed, '0 0 * * *#1' is not an accepted Cron representation: Element '* of daysOfWeek field is invalid. (Input cron: '0 0 * * *#1')`
        }
      ]
    ],
    ['0 0 * * 2', '0 0 * * 2'],
    ['0 14 * * 5#1', '0 14 * * 5#1']
  ])("when the cron is '%s' return '%o'", (payload: unknown, expectedResult: DevFriendlyError[] | string): void => {
    expect(
      pipe(isCronString.decode(payload), (validation: Validation<Cron>): DevFriendlyError[] | string =>
        fold(
          (): DevFriendlyError[] | string => HttpReporter.report(validation),
          (right: string): string => right
        )(validation)
      )
    ).toStrictEqual(expectedResult);
  });
});
