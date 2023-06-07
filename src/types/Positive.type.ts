import * as t from 'io-ts';

type PositiveBrand = {
  readonly Positive: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
};

export const Positive = t.brand(
  t.number, // a codec representing the type to be refined
  (num): num is t.Branded<number, PositiveBrand> => num > 0, // a custom type guard using the build-in helper `Branded`
  'Positive' // the name must match the readonly field in the brand
);

export type Positive = t.TypeOf<typeof Positive>;
