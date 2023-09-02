import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/http-reporter';
import { Place } from '../../definitions';

export type SearchPlaceAdapter = (predict: string) => TaskEither<Errors, Place[]>;

export const searchPlace =
  (serviceCall: SearchPlaceAdapter) =>
  (search: string): TaskEither<Errors, Place[]> =>
    serviceCall(search);
