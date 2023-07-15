import { pipe } from 'fp-ts/function';
import { externalTypeCheckFor } from '../../rules/validation';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { OpenAICompletionResponseTransfer, openAICompletionTransferCodec } from './openai-completion.codec';

export const completionValidation = (transfer: unknown): TaskEither<Errors, OpenAICompletionResponseTransfer> =>
  pipe(transfer, externalTypeCheckFor<OpenAICompletionResponseTransfer>(openAICompletionTransferCodec), fromEither);
