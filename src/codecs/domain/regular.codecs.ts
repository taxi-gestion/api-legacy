import { intersection as ioIntersection, string as ioString, type as ioType, Type, array as ioArray } from 'io-ts';
import { Entity, Regular } from '../../definitions';
import { entityCodec, passengerRulesCodec } from './traits.codecs';

export const regularPassengerCodec: Type<Regular> = ioType({
  firstname: ioString,
  lastname: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const regularPassengerRulesCodec = ioIntersection([regularPassengerCodec, passengerRulesCodec]);

export const regularPassengerEntityCodec: Type<Entity & Regular> = ioIntersection([entityCodec, regularPassengerCodec]);

export const regularsCodec: Type<(Entity & Regular)[]> = ioArray(regularPassengerEntityCodec)

