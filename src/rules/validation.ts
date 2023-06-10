import { Type, Validation } from 'io-ts';

export const externalTypeCheckFor =
  <T>(codec: Type<T>) =>
  (transfer: unknown): Validation<T> =>
    codec.decode(transfer);
