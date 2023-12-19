import { TaskEither } from 'fp-ts/TaskEither';
import { Place } from '../../definitions';
import { Errors } from '../../codecs';

export type SearchPlaceAdapter = (predict: string) => TaskEither<Errors, Place[]>;

export const searchPlace =
  (serviceCall: SearchPlaceAdapter) =>
  (search: string): TaskEither<Errors, Place[]> =>
    serviceCall(search);
