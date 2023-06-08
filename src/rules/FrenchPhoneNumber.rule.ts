import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';
import { withMessage } from 'io-ts-types';

const formatPhone = (phone?: string): string => phone?.replace('(0)', '').replace(/[^+\d]/gu, '') ?? '';

const frenchPhoneRegex: RegExp = /^(?:(?:\+|00)33|0)[1-9]\d{8}$/gu;

const isFrenchPhone = (phone?: string): boolean => frenchPhoneRegex.test(formatPhone(phone));

type FrenchPhoneNumberBrand = {
  readonly isFrenchPhoneNumber: unique symbol; // use `unique symbol` here to ensure uniqueness across modules / packages
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const isFrenchPhoneNumber: BrandC<StringC, FrenchPhoneNumberBrand> = withMessage(
  t.brand(
    t.string, // a codec representing the type to be refined
    (phoneNumber: string): phoneNumber is t.Branded<string, FrenchPhoneNumberBrand> => isFrenchPhone(phoneNumber), // a custom type guard using the build-in helper `Branded`
    'isFrenchPhoneNumber' // the name must match the readonly field in the brand
  ),
  (input: unknown): string =>
    `Rulecheck failed, '${String(input)}' is not a valid french phone number that match '${String(frenchPhoneRegex)}' regex`
);

export type FrenchPhoneNumber = t.TypeOf<typeof isFrenchPhoneNumber>;
