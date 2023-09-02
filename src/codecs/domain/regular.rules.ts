import { intersection as ioIntersection } from 'io-ts';
import { regularPassengerCodec } from './regular.codecs';
import { passengerRulesCodec } from './traits.rules';

// eslint-disable-next-line @typescript-eslint/typedef
export const regularPassengerRulesCodec = ioIntersection([regularPassengerCodec, passengerRulesCodec]);
