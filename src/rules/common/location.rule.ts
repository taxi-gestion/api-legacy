import { withMessage } from 'io-ts-types';
import { brand, BrandC, Branded, Type } from 'io-ts';
import { isValidLocation, Location } from '../../definitions';
import { locationCodec } from '../../codecs';

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
