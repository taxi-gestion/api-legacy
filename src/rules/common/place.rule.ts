/* eslint-disable @typescript-eslint/typedef */
import { string as ioString, type as ioType } from 'io-ts';
import { isLocation } from './location.rule';

export const placeRulesCodec = ioType({
  context: ioString,
  label: ioString,
  location: isLocation
});
