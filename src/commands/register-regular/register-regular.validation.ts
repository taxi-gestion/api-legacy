import type { Validation } from 'io-ts';
import { type as ioType, Type } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  externalTypeCheckFor,
  regularPassengerCodec,
  regularPassengerEntityCodec,
  regularPassengerRulesCodec
} from '../../codecs';
import { RegularRegistered, RegularToRegister } from './register-regular.route';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/http-reporter';

export const registerRegularValidation = (transfer: unknown): Either<Errors, RegularToRegister> =>
  pipe(transfer, externalTypeCheckFor<RegularToRegister>(regularToRegisterCodec), eitherChain(rulesCheck));

export const registeredRegularValidation = (transfer: unknown): TaskEither<Errors, RegularRegistered> =>
  pipe(transfer, externalTypeCheckFor<RegularRegistered>(regularRegisteredCodec), fromEither);

const rulesCheck = (regular: RegularToRegister): Validation<RegularToRegister> => regularToRegisterRulesCodec.decode(regular);

const regularToRegisterCodec: Type<RegularToRegister> = ioType({
  toRegister: regularPassengerCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const regularToRegisterRulesCodec = ioType({
  toRegister: regularPassengerRulesCodec
});

const regularRegisteredCodec: Type<RegularRegistered> = ioType({
  regularRegistered: regularPassengerEntityCodec
});
