import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  GoogleMapsPlacesResponseTransfer,
  googleMapsPlacesTransferCodec,
  placesRulesCodec,
  placesCodec,
  PlaceResultTransfer
} from './search-place.codec';
import { Place } from '../../../definitions';
import { Errors } from '../../../reporter/HttpReporter';
import { externalTypeCheckFor } from '../../../codecs';

export const searchPlaceValidation = (transfer: unknown): TaskEither<Errors, Place[]> =>
  pipe(
    transfer,
    externalTypeCheckFor<GoogleMapsPlacesResponseTransfer>(googleMapsPlacesTransferCodec),
    eitherChain(internalTypeCheckForPlaces),
    eitherChain(rulesCheckForPlaces),
    fromEither
  );

const toPlaces = (places: PlaceResultTransfer[]): Place[] =>
  places.map(
    (place: PlaceResultTransfer): Place => ({
      context: place.formatted_address,
      label: place.name ?? place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      }
    })
  );

const internalTypeCheckForPlaces = (placeTransfer: GoogleMapsPlacesResponseTransfer): Either<Errors, Place[]> =>
  placesCodec.decode(toPlaces(placeTransfer.results));

const rulesCheckForPlaces = (recurrence: Place[]): Either<Errors, Place[]> => placesRulesCodec.decode(recurrence);
