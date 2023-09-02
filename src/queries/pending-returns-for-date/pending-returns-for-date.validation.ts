import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Pending } from '../../definitions';
import { externalTypeCheckFor, pendingReturnsCodec } from '../../codecs';

export const pendingReturnsValidation = (transfer: unknown): TaskEither<Errors, (Entity & Pending)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Pending)[]>(pendingReturnsCodec), fromEither);
