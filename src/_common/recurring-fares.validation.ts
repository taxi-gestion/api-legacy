import { Errors, externalTypeCheckFor, recurringFaresCodec } from '../codecs';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { QueriesResult } from '../definitions';

export const recurringFaresValidation = (transfer: unknown): TaskEither<Errors, QueriesResult<'recurring-fares'>> =>
  pipe(transfer, externalTypeCheckFor<QueriesResult<'recurring-fares'>>(recurringFaresCodec), fromEither);
