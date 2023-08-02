import { pipe } from 'fp-ts/function';
import { PredictRecurrenceTransfer, predictRecurrenceTransferCodec } from './predict-recurrence.codec';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { PredictRecurrence } from '../../definitions';
import { externalTypeCheckFor } from '../../codecs';

export const predictRecurrenceValidation = (transfer: unknown): TaskEither<Errors, PredictRecurrence> =>
  pipe(transfer, externalTypeCheckFor<PredictRecurrenceTransfer>(predictRecurrenceTransferCodec), fromEither);
