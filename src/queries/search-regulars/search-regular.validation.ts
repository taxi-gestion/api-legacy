import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, RegularDetails } from '../../definitions';
import { externalTypeCheckFor, regularsDetailsEntitiesCodec, stringCodec } from '../../codecs';

export const searchRegularValidation = (transfer: unknown): TaskEither<Errors, string> =>
  pipe(transfer, stringCodec.decode, fromEither);

export const regularsValidation = (transfer: unknown): TaskEither<Errors, (Entity & RegularDetails)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & RegularDetails)[]>(regularsDetailsEntitiesCodec), fromEither);
