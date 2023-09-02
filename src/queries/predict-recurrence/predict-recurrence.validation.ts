import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { PredictRecurrence } from '../../definitions';
import { predictRecurrenceCodec } from '../../codecs';

export const predictRecurrenceValidation = (transfer: unknown): TaskEither<Errors, PredictRecurrence> =>
  pipe(transfer, predictRecurrenceCodec.decode, fromEither);
