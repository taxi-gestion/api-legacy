import { Type } from 'io-ts';
import { Journey } from '../../definitions';
import { journeyCodec } from '../../codecs';

export type JourneyTransfer = Journey;
export const journeyTransferCodec: Type<JourneyTransfer> = journeyCodec;
