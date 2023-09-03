import { intersection as ioIntersection } from 'io-ts';
import { passengerRulesCodec } from './traits.rules';
import { regularPassengerCodec } from '../../codecs';

// eslint-disable-next-line @typescript-eslint/typedef
export const regularPassengerRulesCodec = ioIntersection([regularPassengerCodec, passengerRulesCodec]);
