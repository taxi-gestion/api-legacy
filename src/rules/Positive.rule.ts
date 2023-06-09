import { withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, NumberC } from 'io-ts';

export const isPositive: BrandC<NumberC, PositiveBrand> = withMessage(
  t.brand(t.number, (num: number): num is t.Branded<number, PositiveBrand> => num > 0, 'isPositive'),
  (input: unknown): string => `Rulecheck failed, '${String(input)}' is not a positive integer`
);

type PositiveBrand = {
  readonly isPositive: unique symbol;
};

export type Positive = t.TypeOf<typeof isPositive>;
