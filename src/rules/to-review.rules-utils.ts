import { Errors } from 'io-ts';
import { Either } from 'fp-ts/Either';

type Decodable<T> = {
  decode: (input: unknown) => Either<Errors, T>;
};

export const typeCheck =
  <T>(type: Decodable<T>) =>
  (instance: unknown): Either<Errors, T> =>
    type.decode(instance);

export const ruleCheck =
  <T>(rules: Decodable<T>) =>
  (instance: unknown): Either<Errors, T> =>
    rules.decode(instance);
