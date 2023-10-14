/* eslint-disable @typescript-eslint/typedef */
import { intersection as ioIntersection, type as ioType } from 'io-ts';
import { waypointCodec } from '../../codecs';
import { placeRulesCodec } from '../common';

export const waypointRulesCodec = ioIntersection(
  [
    waypointCodec,
    ioType({
      place: placeRulesCodec
    })
  ],
  'waypointRulesCodec'
);
