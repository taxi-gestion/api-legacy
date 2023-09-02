import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { stringCodec } from '../../codecs';

export const searchPlaceValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, stringCodec.decode, fromEither);
