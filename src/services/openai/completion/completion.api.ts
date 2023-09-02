import { chain as taskEitherChain, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { Errors } from '../../../reporter';
import { pipe } from 'fp-ts/function';
import { OpenAICompletionPayload, OpenAICompletionResponseTransfer } from './completion.codec';
import { completionValidation } from './completion.validation';
import { onDependencyError } from '../../../errors';
import axios from 'axios';

export const $openAICompletion =
  (openAiApiKey: string) =>
  (prompt: OpenAICompletionPayload): TaskEither<Errors, OpenAICompletionResponseTransfer> =>
    pipe($callToOpenAi(openAiApiKey)(prompt), taskEitherChain(completionValidation));

const $callToOpenAi =
  (openAiApiKey: string) =>
  (prompt: OpenAICompletionPayload): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(
      // eslint-disable-next-line @typescript-eslint/return-await,@typescript-eslint/await-thenable
      async (): Promise<unknown> => await callToOpenAiCompletionApi(openAiApiKey)(prompt),
      (reason: unknown): Errors => onDependencyError('call to openAI completion api error', reason)
    );

const callToOpenAiCompletionApi =
  (openAiApiKey: string) =>
  async (prompt: OpenAICompletionPayload): Promise<unknown> => {
    const response: axios.AxiosResponse<unknown> = await axios({
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
    return response.data;
  };
