import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../../reporter/http-reporter';
import { OpenAICompletionResponseTransfer, openAICompletionTransferCodec } from './completion.codec';
import { externalTypeCheckFor } from '../../../codecs';

export const completionValidation = (transfer: unknown): TaskEither<Errors, OpenAICompletionResponseTransfer> =>
  pipe(transfer, externalTypeCheckFor<OpenAICompletionResponseTransfer>(openAICompletionTransferCodec), fromEither);
