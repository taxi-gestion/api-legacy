import { PredictedRecurrence, PredictRecurrence } from '../../../definitions';
import { chain as taskEitherChain, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../reporter';
import { pipe } from 'fp-ts/function';
import { $openAICompletion } from '../completion/completion.api';
import { predictedRecurrenceValidation } from './predicted-recurrence.validation';
import { OpenAICompletionPayload } from '../completion/completion.codec';

export const $openAIPredictRecurrence =
  (openAIApiKey: string) =>
  (predictQuery: PredictRecurrence): TaskEither<Errors, PredictedRecurrence> =>
    pipe(
      $openAICompletion(openAIApiKey)(predictRecurrencePrompt(predictQuery.query)),
      taskEitherChain(predictedRecurrenceValidation)
    );

// eslint-disable-next-line max-lines-per-function
const predictRecurrencePrompt = (query: string): OpenAICompletionPayload => ({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: `You aim to provide a valid UNIX Cron format  that represents the user's description of a recurring event in French. 
                For the days representation 0 is Sunday and 6 is Saturday.
                You can use the # to represent the Nth occurrence of a day in the month, for example 5#1 represent the first Friday.
                You can not use the '?' blank day notation.
                You can not use the 'L' character to represent the last occurrence of a weekday in a month.
                The cron string does not uses seconds nor years.
                The answer must be a json-compliant object with the format { query: USER_INPUT_HERE, recurrence: CRON_STRING_HERE, explanation: EXPLAIN_YOUR_REASONING_IN_FRENCH_HERE }.`
    },
    {
      role: 'user',
      content: `${query}`
    }
  ],
  temperature: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  max_tokens: 512,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  top_p: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  frequency_penalty: 0,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  presence_penalty: 0
});
