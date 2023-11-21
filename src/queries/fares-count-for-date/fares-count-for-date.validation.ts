import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { FaresCount } from '../../definitions';
import { Errors, externalTypeCheckFor, faresCountCodec } from '../../codecs';

export const faresCountForDateValidation = (transfer: unknown): TaskEither<Errors, FaresCount> =>
  pipe(transfer, externalTypeCheckFor<FaresCount>(faresCountCodec), fromEither);
