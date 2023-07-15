import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { Errors } from '../../reporter/HttpReporter';
import { OpenAICompletionResponseTransfer } from '../openai-completion/openai-completion.codec';
import { PredictedRecurrence } from '../../definitions/recurrence.definition';
import { predictedRecurrenceCodec, predictedRecurrenceRulesCodec } from './predicted-recurrence.codec';

export const predictedRecurrenceValidation = (
  transfer: OpenAICompletionResponseTransfer
): TaskEither<Errors, PredictedRecurrence> =>
  pipe(transfer, internalTypeCheckForPredictedRecurrence, eitherChain(rulesCheckForPredictedRecurrence), fromEither);

const internalTypeCheckForPredictedRecurrence = (
  completionTransfer: OpenAICompletionResponseTransfer
): Either<Errors, PredictedRecurrence> => {
  const recurrence: unknown = JSON.parse(completionTransfer.choices.at(-1)?.message.content ?? '');
  return predictedRecurrenceCodec.decode(recurrence);
};

const rulesCheckForPredictedRecurrence = (recurrence: PredictedRecurrence): Either<Errors, PredictedRecurrence> =>
  predictedRecurrenceRulesCodec.decode(recurrence);
