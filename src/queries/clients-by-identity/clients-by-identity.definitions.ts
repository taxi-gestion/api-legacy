import { FastifyRequest } from 'fastify';
import { string as ioString, type as ioType, TypeOf } from 'io-ts';

// eslint-disable-next-line @typescript-eslint/typedef
export const clientForFareCodec = ioType({
  identity: ioString,
  lastDeparture: ioString,
  lastDestination: ioString,
  phone: ioString
});

export type ClientForFare = TypeOf<typeof clientForFareCodec>;
export type ClientsForFare = ClientForFare[];

export type ClientsByIdentityRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    identity: string;
  };
}>;
