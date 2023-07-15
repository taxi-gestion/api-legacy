import { chain as taskEitherChain, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import axios from 'axios';
import { onDependencyError } from '../../reporter/onDependencyError.error';
import { pipe } from 'fp-ts/function';
import { OpenAICompletionResponseTransfer } from './openai-completion.codec';
import { completionValidation } from './completion.validation';

export const $openAICompletion =
  (openAiApiKey: string) =>
  (prompt: object): TaskEither<Errors, OpenAICompletionResponseTransfer> =>
    pipe($callToOpenAi(openAiApiKey)(prompt), taskEitherChain(completionValidation));

const $callToOpenAi =
  (openAiApiKey: string) =>
  (prompt: object): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(
      // eslint-disable-next-line @typescript-eslint/return-await,@typescript-eslint/await-thenable
      async (): Promise<unknown> => await callToOpenAiCompletionApi(openAiApiKey)(prompt),
      (reason: unknown): Errors => onDependencyError('call to openAI completion api error', reason)
    );

const callToOpenAiCompletionApi = (openAiApiKey: string) => (prompt: object) => async (): Promise<unknown> =>
  axios({
    method: 'post',
    url: 'https://api.openai.com/v1/chat/completions',
    data: prompt,
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: `Bearer ${openAiApiKey}`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json'
    },
    responseType: 'json'
  });
