import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { RegularHistory } from '../../definitions';
import { externalTypeCheckFor, regularHistoryCodec } from '../../codecs';
import { uuidRule } from '../../rules';
import { Either } from 'fp-ts/Either';

export const regularHistoryValidation = (transfer: unknown): Either<Errors, string> => pipe(transfer, uuidRule.decode);
export const historyValidation = (transfer: unknown): TaskEither<Errors, RegularHistory> =>
  pipe(transfer, externalTypeCheckFor<RegularHistory>(regularHistoryCodec), fromEither);
