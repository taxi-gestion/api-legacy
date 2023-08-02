import type { Type } from 'io-ts';
import { string as ioString } from 'io-ts';

export const searchPlaceTransferCodec: Type<string> = ioString;
