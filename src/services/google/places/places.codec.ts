import {
  array as ioArray,
  number as ioNumber,
  string as ioString,
  Type,
  type as ioType,
  undefined as ioUndefined,
  union as ioUnion
} from 'io-ts';
import { Place } from '../../../definitions';
import { placeCodec } from '../../../codecs';
import { placeRulesCodec } from '../../../rules';

export type GoogleMapsPlacesResponseTransfer = {
  results: PlaceResultTransfer[];
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

export const googleMapsPlacesTransferCodec: Type<GoogleMapsPlacesResponseTransfer> = ioType({
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
});
/* eslint-enable */

export const placesCodec: Type<Place[]> = ioArray(placeCodec);

// eslint-disable-next-line @typescript-eslint/typedef
export const placesRulesCodec = ioArray(placeRulesCodec);
