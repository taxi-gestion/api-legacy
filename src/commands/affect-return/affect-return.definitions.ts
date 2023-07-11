import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, Type } from 'io-ts';
import { string as ioString, type as ioType } from 'io-ts';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

export type ReturnToAffectTransfer = {
  fareId: string;
  driveFrom: string;
  planning: string;
  driveTo: string;
  startTime: string;
};

export const returnToAffectTransferCodec: Type<ReturnToAffectTransfer> = excess(
  ioType({
    fareId: ioStringWithTypeCheckFailedMessage,
    driveFrom: ioStringWithTypeCheckFailedMessage,
    driveTo: ioStringWithTypeCheckFailedMessage,
    planning: ioStringWithTypeCheckFailedMessage,
    startTime: ioStringWithTypeCheckFailedMessage
  })
);
