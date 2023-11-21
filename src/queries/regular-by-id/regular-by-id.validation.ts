import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Regular } from '../../definitions';
import { Errors, externalTypeCheckFor, isUUIDString, regularEntityCodec } from '../../codecs';

export const regularByIdValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, isUUIDString.decode, fromEither);

export const regularValidation = (transfer: unknown): TaskEither<Errors, Entity & Regular> =>
  pipe(transfer, externalTypeCheckFor<Entity & Regular>(regularEntityCodec), fromEither);
