import { type as ioType, Type } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor, regularCodec, regularRegisteredCodec, Errors } from '../../codecs';
import { RegularToRegister } from './register-regular.route';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { RegisterRegular } from '../../definitions';
import { regularRules } from '../../codecs/domain-rules/regular.rules';

export const registerRegularValidation = (transfer: unknown): Either<Errors, RegularToRegister> =>
  pipe({ toRegister: transfer }, externalTypeCheckFor<RegularToRegister>(regularToRegisterCodec), eitherChain(rulesCheck));

export const registeredRegularValidation = (transfer: unknown): TaskEither<Errors, RegisterRegular> =>
  pipe(transfer, externalTypeCheckFor<RegisterRegular>(regularRegisteredCodec), fromEither);

const rulesCheck = (regular: RegularToRegister): Either<Errors, RegularToRegister> =>
  regularToRegisterRulesCodec.decode(regular);

const regularToRegisterCodec: Type<RegularToRegister> = ioType({
  toRegister: regularCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const regularToRegisterRulesCodec = ioType({
  toRegister: regularRules
});
