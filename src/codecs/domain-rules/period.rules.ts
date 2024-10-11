import { BrandC, StringC, type as ioType, TypeC } from 'io-ts';
import { DateBrand, isYYYYMMDDDate } from '../rules';

export const periodRules: TypeC<{
  from: BrandC<StringC, DateBrand>;
  to: BrandC<StringC, DateBrand>;
}> = ioType(
  {
    from: isYYYYMMDDDate,
    to: isYYYYMMDDDate
  },
  'periodRules'
);
