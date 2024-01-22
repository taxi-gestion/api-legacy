import { array as ioArray, Type } from 'io-ts';
import { Place } from '../../../definitions';
import { placeCodec } from '../../../codecs';
import { placeRules } from '../../../codecs/domain-rules/place.rules';

export type GoogleMapsPlacesResponseTransfer = {
  predictions: PlaceResultTransfer[];
  status: string;
};

/* eslint-disable */
export type PlaceResultTransfer = {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string | undefined;
};

/*export const googleMapsPlacesTransferCodec: Type<GoogleMapsPlacesResponseTransfer> = ioType({
  status: ioString,
  results: ioArray(
    ioType({
      geometry: ioType({
        location: ioType({
          lat: ioNumber,
          lng: ioNumber
        })
      }),
      formatted_address: ioString,
      name: ioUnion([ioString, ioUndefined])
    })
  )
});*/
/* eslint-enable */

export const placesCodec: Type<Place[]> = ioArray(placeCodec);

// eslint-disable-next-line @typescript-eslint/typedef
export const placesRulesCodec = ioArray(placeRules);
