import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Regular } from '../../definitions';
import { Errors, externalTypeCheckFor, regularsEntitiesCodec, stringCodec } from '../../codecs';

export const searchRegularValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, stringCodec.decode, fromEither);

export const regularsValidation = (transfer: unknown): TaskEither<Errors, (Entity & Regular)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Regular)[]>(regularsEntitiesCodec), fromEither);
