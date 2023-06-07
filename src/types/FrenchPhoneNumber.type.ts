import * as t from 'io-ts';

const formatPhone = (phone?: string): string => phone?.replace('(0)', '').replace(/[^+\d]/gu, '') ?? '';

const isPhone = (phone?: string): boolean => /^(?:(?:\+|00)33|0)[1-9]\d{8}$/gu.test(formatPhone(phone));

type FrenchPhoneNumberBrand = {
  readonly FrenchPhoneNumber: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
};

export const FrenchPhoneNumber = t.brand(
  t.string, // a codec representing the type to be refined
  (str): str is t.Branded<string, FrenchPhoneNumberBrand> => isPhone(str), // a custom type guard using the build-in helper `Branded`
  'FrenchPhoneNumber' // the name must match the readonly field in the brand
);

export type FrenchPhoneNumber = t.TypeOf<typeof FrenchPhoneNumber>;
