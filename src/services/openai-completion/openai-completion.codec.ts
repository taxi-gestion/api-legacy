import type { Type } from 'io-ts';
import { array as ioArray, number as ioNumber, string as ioString, type as ioType } from 'io-ts';

/* eslint-disable @typescript-eslint/naming-convention, camelcase, id-denylist */
export type OpenAICompletionPayload = {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
};

export type OpenAICompletionResponseTransfer = {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: CompletionChoiceTransfer[];
};

export type CompletionChoiceTransfer = {
  message: OpenAIMessage;
  finish_reason: string;
  index: number;
};

export type OpenAIMessage = {
  role: string;
  content: string;
};

export const openAICompletionTransferCodec: Type<OpenAICompletionResponseTransfer> = ioType({
  id: ioString,
  // eslint-disable-next-line id-denylist
  object: ioString,
  created: ioNumber,
  model: ioString,
  usage: ioType({
    prompt_tokens: ioNumber,
    completion_tokens: ioNumber,
    total_tokens: ioNumber
  }),
  choices: ioArray(
    ioType({
      message: ioType({
        role: ioString,
        content: ioString
      }),
      finish_reason: ioString,
      index: ioNumber
    })
  )
});
/* eslint-enable @typescript-eslint/naming-convention, camelcase, id-denylist */
