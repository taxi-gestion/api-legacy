import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { Regular } from '../../definitions';
import { regularPassengerCodec, regularPassengerRulesCodec } from '../../codecs';

export const registerRegularValidation = (transfer: unknown): Either<Errors, Regular> =>
  pipe(transfer, internalTypeCheckForRegular, eitherChain(rulesCheckForRegular));
const internalTypeCheckForRegular = (regularTransfer: unknown): Validation<Regular> =>
  regularPassengerCodec.decode(regularTransfer);

const rulesCheckForRegular = (regular: Regular): Validation<Regular> => regularPassengerRulesCodec.decode(regular);
