import { Either, fold as eitherFold } from 'fp-ts/Either';
import { CompletionChoiceTransfer, OpenAICompletionResponseTransfer } from '../completion/completion.codec';
import { predictedRecurrenceValidation } from './predicted-recurrence.validation';
import { TaskEither } from 'fp-ts/TaskEither';
import { PredictedRecurrence } from '../../../definitions';
import HttpReporter, { DevFriendlyError, Errors } from '../../../reporter/HttpReporter';

describe('Predicted recurrence validation tests', (): void => {
  const base: OpenAICompletionResponseTransfer = {
    choices: [],
    created: 123456,
    id: 'plop',
    model: 'gpt-3.5-turbo',
    object: 'plop',
    usage: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      prompt_tokens: 80,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      completion_tokens: 130,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      total_tokens: 210
    }
  };

  const validAnswer: CompletionChoiceTransfer = {
    message: {
      role: 'assistant',
      content:
        '{\n  "query": "tous les premiers vendredis du mois",\n  "recurrence": "0 14 * * 5#1",\n  "explanation": "Le moment précis spécifié est le vendredi 13 juillet 2023 à 14h00. Pour que l\'événement se répète tous les premiers vendredis du mois, nous utilisons les paramètres de la chaîne Cron suivants : 0 (dimanche) 14h00 * (tous les mois) * (tous les jours de la semaine) 5#1 (premier vendredi du mois). Ainsi, la chaîne Cron finale est : \'0 14 * * 5#1\'."\n}'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    finish_reason: 'stop',
    index: 0
  };

  const valid: OpenAICompletionResponseTransfer = {
    ...base,
    choices: [validAnswer]
  };

  const validPredictedRecurrence: PredictedRecurrence = {
    explanation:
      "Le moment précis spécifié est le vendredi 13 juillet 2023 à 14h00. Pour que l'événement se répète tous les premiers vendredis du mois, nous utilisons les paramètres de la chaîne Cron suivants : 0 (dimanche) 14h00 * (tous les mois) * (tous les jours de la semaine) 5#1 (premier vendredi du mois). Ainsi, la chaîne Cron finale est : '0 14 * * 5#1'.",
    query: 'tous les premiers vendredis du mois',
    recurrence: '0 14 * * 5#1'
  };

  it.each([[valid, validPredictedRecurrence]])(
    'should return %s when the transfer request payload is %s',
    async (
      payload: OpenAICompletionResponseTransfer,
      expectedValue: DevFriendlyError[] | PredictedRecurrence
    ): Promise<void> => {
      const taskEither: TaskEither<Errors, PredictedRecurrence> = predictedRecurrenceValidation(payload);
      const either: Either<Errors, PredictedRecurrence> = await taskEither();

      eitherFold(
        (): void => {
          expect(HttpReporter.report(either)).toStrictEqual(expectedValue);
        },
        (value: PredictedRecurrence): void => expect(value).toStrictEqual(expectedValue)
      )(either);
    }
  );
});
