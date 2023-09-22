import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, RegularDetails } from '../../definitions';
import { externalTypeCheckFor, regularDetailsEntityCodec } from '../../codecs';
import { uuidCodec } from '../../codecs/common/uuid.codec';

export const regularByIdValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, uuidCodec.decode, fromEither);

export const regularValidation = (transfer: unknown): TaskEither<Errors, Entity & RegularDetails> =>
  pipe(transfer, externalTypeCheckFor<Entity & RegularDetails>(regularDetailsEntityCodec), fromEither);
