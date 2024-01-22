import { string as ioString, type as ioType, Type, union as ioUnion, undefined as ioUndefined } from 'io-ts';
import { locationCodec } from './location.codec';
import { Place } from '../../definitions';

export const placeCodec: Type<Place> = ioType(
  {
    context: ioString,
    label: ioString,
    location: ioUnion([locationCodec, ioUndefined])
  },
  'placeCodec'
);
