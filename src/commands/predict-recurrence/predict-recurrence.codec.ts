import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, Type } from 'io-ts';
import { string as ioString, type as ioType } from 'io-ts';
import { PredictRecurrence } from '../../definitions';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

export type PredictRecurrenceTransfer = PredictRecurrence;

export const predictRecurrenceTransferCodec: Type<PredictRecurrenceTransfer> = excess(
  ioType({
    query: ioStringWithTypeCheckFailedMessage
  })
);
