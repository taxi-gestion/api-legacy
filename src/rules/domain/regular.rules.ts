/* eslint-disable @typescript-eslint/typedef */
import {
  intersection as ioIntersection,
  type as ioType,
  array as ioArray,
  union as ioUnion,
  undefined as ioUndefined,
  string as ioString
} from 'io-ts';
import { regularDetailsCodec } from '../../codecs';
import { isFrenchPhoneNumber, placeRulesCodec } from '../common';
import { destinationRulesCodec } from './destination.rule';

export const phoneRulesCodec = ioType(
  {
    // eslint-disable-next-line id-denylist
    number: isFrenchPhoneNumber,
    type: ioString
  },
  'phoneRulesCodec'
);

export const regularDetailsRulesCodec = ioIntersection(
  [
    regularDetailsCodec,
    ioType({
      phones: ioUnion([ioArray(phoneRulesCodec), ioUndefined]),
      home: ioUnion([placeRulesCodec, ioUndefined]),
      destinations: ioUnion([ioArray(destinationRulesCodec), ioUndefined])
    })
  ],
  'regularDetailsRulesCodec'
);
