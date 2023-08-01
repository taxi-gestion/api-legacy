import { withMessage } from 'io-ts-types';
import { BrandC, Type, brand, Branded } from 'io-ts';
import { locationCodec } from './location.codec';
import { isValidLocation, Location } from '../definitions';

export const isLocation: BrandC<Type<Location>, LocationBrand> = withMessage(
  brand(
    locationCodec,
    (location: Location): location is Branded<Location, LocationBrand> => isValidLocation(location),
    'isLocation'
  ),
  (input: unknown): string => `Rules check failed, '${String(input)}' is not a valid location`
);

type LocationBrand = {
  readonly isLocation: unique symbol;
};
