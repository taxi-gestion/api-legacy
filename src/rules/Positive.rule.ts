import * as t from 'io-ts';
import { BrandC, NumberC } from 'io-ts';

type PositiveBrand = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly Positive: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const isPositive: BrandC<NumberC, PositiveBrand> = t.brand(
  t.number, // a codec representing the type to be refined
  (num: number): num is t.Branded<number, PositiveBrand> => num > 0, // a custom type guard using the build-in helper `Branded`
  'Positive' // the name must match the readonly field in the brand
);

export type Positive = t.TypeOf<typeof isPositive>;
