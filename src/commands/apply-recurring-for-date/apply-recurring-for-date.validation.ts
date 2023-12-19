import { pipe } from 'fp-ts/function';
import { Errors, externalTypeCheckFor, recurringsAppliedCodec } from '../../codecs';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { RecurringApplied } from '../../definitions';

export const recurringAppliedValidation = (transfer: unknown): TaskEither<Errors, RecurringApplied[]> =>
  pipe(transfer, externalTypeCheckFor<RecurringApplied[]>(recurringsAppliedCodec), fromEither);
