import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { placesCodec, placesRulesCodec } from './places.codec';
import { Place } from '../../../definitions';
import { Errors } from '../../../codecs';

export const searchPlaceValidation = (transfer: unknown): TaskEither<Errors, Place[]> =>
  pipe(transfer, toPlacesCandidate, internalTypeCheckForPlaces, eitherChain(rulesCheckForPlaces), fromEither);

/* eslint-disable @typescript-eslint/naming-convention */
type AutoCompletePrediction = { description: string; structured_formatting?: { main_text: string; secondary_text: string } };

const toPlacesCandidate = (transfer: unknown): unknown[] =>
  (transfer as { predictions: AutoCompletePrediction[] }).predictions.map(
    (place: AutoCompletePrediction): Place => ({
      context: place.description,
      label: place.structured_formatting?.main_text ?? place.description,
      location: undefined
    })
  );
/* eslint-enable @typescript-eslint/naming-convention */

const internalTypeCheckForPlaces = (places: unknown): Either<Errors, Place[]> => placesCodec.decode(places);

const rulesCheckForPlaces = (recurrence: Place[]): Either<Errors, Place[]> => placesRulesCodec.decode(recurrence);
