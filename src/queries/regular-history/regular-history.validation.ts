import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { RegularHistory } from '../../definitions';
import { Errors, externalTypeCheckFor, isUUIDString, regularHistoryCodec } from '../../codecs';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';

export const regularHistoryValidation = (transfer: unknown): Either<Errors, string> => pipe(transfer, isUUIDString.decode);
export const historyValidation = (transfer: unknown): TaskEither<Errors, RegularHistory> =>
  pipe(transfer, externalTypeCheckFor<RegularHistory>(regularHistoryCodec), fromEither);
