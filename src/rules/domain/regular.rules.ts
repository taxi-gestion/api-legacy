/* eslint-disable @typescript-eslint/typedef */
import {
  intersection as ioIntersection,
  type as ioType,
  array as ioArray,
  union as ioUnion,
  undefined as ioUndefined
} from 'io-ts';
import { passengerRulesCodec } from './traits.rules';
import { regularCodec, regularDetailsCodec } from '../../codecs';
import { isFrenchPhoneNumber, placeRulesCodec } from '../common';

export const regularRulesCodec = ioIntersection([regularCodec, passengerRulesCodec]);

export const regularDetailsRulesCodec = ioIntersection([
  regularDetailsCodec,
  ioType({
    phones: ioUnion([ioArray(isFrenchPhoneNumber), ioUndefined]),
    home: ioUnion([placeRulesCodec, ioUndefined]),
    destinations: ioUnion([ioArray(placeRulesCodec), ioUndefined])
  })
]);
