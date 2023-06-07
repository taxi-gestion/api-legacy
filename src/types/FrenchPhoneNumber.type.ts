import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';

const formatPhone = (phone?: string): string => phone?.replace('(0)', '').replace(/[^+\d]/gu, '') ?? '';

const isPhone = (phone?: string): boolean => /^(?:(?:\+|00)33|0)[1-9]\d{8}$/gu.test(formatPhone(phone));

type FrenchPhoneNumberBrand = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly FrenchPhoneNumber: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FrenchPhoneNumber: BrandC<StringC, FrenchPhoneNumberBrand> = t.brand(
  t.string, // a codec representing the type to be refined
  (str: string): str is t.Branded<string, FrenchPhoneNumberBrand> => isPhone(str), // a custom type guard using the build-in helper `Branded`
  'FrenchPhoneNumber' // the name must match the readonly field in the brand
);

export type FrenchPhoneNumber = t.TypeOf<typeof FrenchPhoneNumber>;
