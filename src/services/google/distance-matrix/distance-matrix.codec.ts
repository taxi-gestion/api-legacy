import { array as ioArray, string as ioString, number as ioNumber, Type, type as ioType } from 'io-ts';

/* eslint-disable @typescript-eslint/naming-convention,id-denylist */
export type GoogleMapsDistanceMatrixResponse = {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: GoogleMapsDistanceMatrixRows[];
  status: string;
};

type GoogleMapsDistanceMatrixRows = {
  elements: GoogleMapsDistanceMatrixElement[];
};

export type GoogleMapsDistanceMatrixElement = {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
};

const distanceMatrixElementCodec: Type<GoogleMapsDistanceMatrixElement> = ioType({
  distance: ioType({
    text: ioString,
    value: ioNumber
  }),
  duration: ioType({
    text: ioString,
    value: ioNumber
  }),
  status: ioString
});

const distanceMatrixRowsCodec: Type<GoogleMapsDistanceMatrixRows> = ioType({
  elements: ioArray(distanceMatrixElementCodec)
});

export const googleMapsDistanceMatrixTransferCodec: Type<GoogleMapsDistanceMatrixResponse> = ioType({
  destination_addresses: ioArray(ioString),
  origin_addresses: ioArray(ioString),
  rows: ioArray(distanceMatrixRowsCodec),
  status: ioString
});
/* eslint-enable @typescript-eslint/naming-convention,id-denylist */
