import { withMessage } from 'io-ts-types';
import * as t from 'io-ts';
import { BrandC, StringC } from 'io-ts';

export const isRegisteredClient: BrandC<StringC, RegisteredClientBrand> = withMessage(
  t.brand(
    t.string,
    (client: string): client is t.Branded<string, RegisteredClientBrand> => isIncludedInMemory(client),
    'isRegisteredClient'
  ),
  (input: unknown): string => `Rulecheck failed, '${String(input)}' is not included in the registered users list`
);

export type RegisteredClient = t.TypeOf<typeof isRegisteredClient>;

const inMemoryClients: string[] = ['romain', 'marc', 'marie'];
const isIncludedInMemory = (client: string): boolean => inMemoryClients.includes(client.toLowerCase());

type RegisteredClientBrand = {
  readonly isRegisteredClient: unique symbol;
};
