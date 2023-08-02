import { Location } from './location.definition';
import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../reporter/HttpReporter';

export type Place = {
  context: string;
  label: string;
  location: Location;
};

export type SearchPlaceAdapter = (predict: string) => TaskEither<Errors, Place[]>;
