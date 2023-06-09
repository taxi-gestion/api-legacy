import { isRegisteredClient, RegisteredClient } from './RegisteredClient.rule';
import { Validation } from 'io-ts';
import HttpReporter, { DevFriendlyError } from '../reporter/HttpReporter';
import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';

describe('isRegisteredClient specification tests', (): void => {
  it.each([
    [
      'Julien',
      [
        {
          failingRule: 'isRegisteredClient',
          inputValue: 'Julien',
          inputKey: '',
          humanReadable: "Rulecheck failed, 'Julien' is not included in the registered users list"
        }
      ]
    ],
    ['romain', 'romain'],
    ['Marc', 'Marc']
  ])("when the client is '%s' return '%o'", (payload: unknown, expectedResult: DevFriendlyError[] | string): void => {
    expect(
      pipe(isRegisteredClient.decode(payload), (validation: Validation<RegisteredClient>): DevFriendlyError[] | string =>
        fold(
          (): DevFriendlyError[] | string => HttpReporter.report(validation),
          (right: string): string => right
        )(validation)
      )
    ).toStrictEqual(expectedResult);
  });
});
