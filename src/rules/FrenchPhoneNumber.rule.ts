import { withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';

export const isFrenchPhoneNumber: BrandC<StringC, FrenchPhoneNumberBrand> = withMessage(
  t.brand(
    t.string,
    (phoneNumber: string): phoneNumber is t.Branded<string, FrenchPhoneNumberBrand> => isFrenchPhone(phoneNumber),
    'isFrenchPhoneNumber'
  ),
  (input: unknown): string =>
    `Rulecheck failed, '${String(
      input
    )}' is not a valid french phone number that match '/^(?:(?:\\+|00)33|0)[1-9]\\d{8}$/gu' regex`
);

export type FrenchPhoneNumber = t.TypeOf<typeof isFrenchPhoneNumber>;

const formatPhone = (phone?: string): string => phone?.replace('(0)', '').replace(/[^+\d]/gu, '') ?? '';

const isFrenchPhone = (phone?: string): boolean => /^(?:(?:\+|00)33|0)[1-9]\d{8}$/gu.test(formatPhone(phone));

type FrenchPhoneNumberBrand = {
  readonly isFrenchPhoneNumber: unique symbol;
};
