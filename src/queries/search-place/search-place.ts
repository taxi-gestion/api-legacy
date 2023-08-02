import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { Place, SearchPlaceAdapter } from '../../definitions';

export const searchPlace =
  (serviceCall: SearchPlaceAdapter) =>
  (search: string): TaskEither<Errors, Place[]> =>
    serviceCall(search);
