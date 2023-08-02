import { pipe } from 'fp-ts/function';
import { searchPlaceTransferCodec } from './search-place.codec';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { externalTypeCheckFor } from '../../codecs';

export const searchPlaceValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, externalTypeCheckFor<string>(searchPlaceTransferCodec), fromEither);
