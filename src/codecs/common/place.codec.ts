import { string as ioString, type as ioType, Type } from 'io-ts';
import { locationCodec } from './location.codec';
import { isLocation } from './location.rule';
import { Place } from '../../definitions';

export const placeCodec: Type<Place> = ioType({
  context: ioString,
  label: ioString,
  location: locationCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
export const placeRulesCodec = ioType({
  context: ioString,
  label: ioString,
  location: isLocation
});
