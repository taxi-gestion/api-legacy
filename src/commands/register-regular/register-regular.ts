import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { Errors } from '../../codecs';
import { RegularToRegister, RegularToRegisterPersist } from './register-regular.route';

export const registerRegular = (fareToSchedule: Either<Errors, RegularToRegister>): Either<Errors, RegularToRegisterPersist> =>
  pipe(fareToSchedule, eitherMap(applyRegister));

const applyRegister = ({ toRegister }: RegularToRegister): RegularToRegisterPersist => ({
  regularToCreate: {
    ...toRegister
  }
});
