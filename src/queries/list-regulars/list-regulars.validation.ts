import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Regular } from '../../definitions';
import { externalTypeCheckFor, regularsCodec } from '../../codecs';

export const regularsValidation = (transfer: unknown): TaskEither<Errors, (Entity & Regular)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Regular)[]>(regularsCodec), fromEither);
