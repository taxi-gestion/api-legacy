/* eslint-disable @typescript-eslint/typedef */
import { intersection as ioIntersection, type as ioType } from 'io-ts';
import { destinationCodec } from '../../codecs';
import { placeRulesCodec } from '../common';

export const destinationRulesCodec = ioIntersection([
  destinationCodec,
  ioType({
    place: placeRulesCodec
  })
]);
