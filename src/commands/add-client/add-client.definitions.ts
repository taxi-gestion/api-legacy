import { intersection as ioIntersection, string as ioString, type as ioType, TypeOf } from 'io-ts';
import { isFrenchPhoneNumber } from '../../rules/FrenchPhoneNumber.rule';
import { FastifyRequest } from 'fastify';

// eslint-disable-next-line @typescript-eslint/typedef
export const clientToAddTransferCodec = ioType({
  identity: ioString,
  departure: ioString,
  destination: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const clientToAddCodec = ioType({
  identity: ioString,
  lastDeparture: ioString,
  lastDestination: ioString,
  phone: ioString
});

// eslint-disable-next-line @typescript-eslint/typedef
export const clientToAddRulesCodec = ioIntersection([
  clientToAddCodec,
  ioType({
    phone: isFrenchPhoneNumber
  })
]);

export type ClientToAddTransfer = TypeOf<typeof clientToAddTransferCodec>;
export type ClientToAdd = TypeOf<typeof clientToAddCodec>;

export type ClientToAddRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ClientToAddTransfer;
}>;
