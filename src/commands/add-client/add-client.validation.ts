import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor } from '../../rules/validation';
import {
  ClientToAdd,
  clientToAddCodec,
  clientToAddRulesCodec,
  ClientToAddTransfer,
  clientToAddTransferCodec
} from './add-client.definitions';

export const addClientValidation = (transfer: unknown): Either<Errors, ClientToAdd> =>
  pipe(
    transfer,
    externalTypeCheckFor<ClientToAddTransfer>(clientToAddTransferCodec),
    eitherChain(internalTypeCheckForClientToAdd),
    eitherChain(rulesCheckForClientToAdd)
  );
const internalTypeCheckForClientToAdd = (clientTransfer: ClientToAddTransfer): Validation<ClientToAdd> =>
  clientToAddCodec.decode({
    identity: clientTransfer.identity,
    departure: clientTransfer.departure,
    phone: clientTransfer.phone,
    destination: clientTransfer.destination
  });

const rulesCheckForClientToAdd = (client: ClientToAdd): Validation<ClientToAdd> => clientToAddRulesCodec.decode(client);
