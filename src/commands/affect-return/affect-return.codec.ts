import { withMessage } from 'io-ts-types';
import excess from 'io-ts-excess';
import type { StringC, Type } from 'io-ts';
import { string as ioString, number as ioNumber, type as ioType } from 'io-ts';

const typeCheckFailedMessage = (): string => `Type check failed`;
const ioStringWithTypeCheckFailedMessage: StringC = withMessage(ioString, typeCheckFailedMessage);

export type ReturnToAffectTransfer = {
  fareId: string;
  driveFrom: PlaceTransfer;
  planning: string;
  driveTo: PlaceTransfer;
  datetime: string;
  duration: number;
  distance: number;
};

type PlaceTransfer = {
  context: string;
  label: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

export const returnToAffectTransferCodec: Type<ReturnToAffectTransfer> = excess(
  ioType({
    fareId: ioStringWithTypeCheckFailedMessage,
    driveFrom: ioType({
      context: ioString,
      label: ioString,
      location: ioType({
        latitude: ioNumber,
        longitude: ioNumber
      })
    }),
    driveTo: ioType({
      context: ioString,
      label: ioString,
      location: ioType({
        latitude: ioNumber,
        longitude: ioNumber
      })
    }),
    planning: ioStringWithTypeCheckFailedMessage,
    datetime: ioStringWithTypeCheckFailedMessage,
    duration: ioNumber,
    distance: ioNumber
  })
);
