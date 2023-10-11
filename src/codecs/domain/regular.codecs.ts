import {
  array as ioArray,
  intersection as ioIntersection,
  string as ioString,
  type as ioType,
  Type,
  undefined as ioUndefined,
  union as ioUnion
} from 'io-ts';
import { Entity, RegularDetails } from '../../definitions';
import { civilityCodec, entityCodec, phoneCodec } from './traits.codecs';
import { waypointCodec } from './waypointCodec';

export const regularDetailsCodec: Type<RegularDetails> = ioType(
  {
    civility: civilityCodec,
    firstname: ioUnion([ioString, ioUndefined]),
    lastname: ioString,
    phones: ioUnion([ioArray(phoneCodec), ioUndefined]),
    destinations: ioUnion([ioArray(waypointCodec), ioUndefined]),
    comment: ioUnion([ioString, ioUndefined]),
    subcontractedClient: ioUnion([ioString, ioUndefined])
  },
  'regularDetailsCodec'
);

export const regularDetailsEntityCodec: Type<Entity & RegularDetails> = ioIntersection(
  [entityCodec, regularDetailsCodec],
  'regularDetailsEntityCodec'
);
export const regularsDetailsEntitiesCodec: Type<(Entity & RegularDetails)[]> = ioArray(
  regularDetailsEntityCodec,
  'regularsDetailsEntitiesCodec'
);
