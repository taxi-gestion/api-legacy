import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Unassigned } from '../../definitions';
import { externalTypeCheckFor, unassignedFaresCodec } from '../../codecs';

export const unassignedFaresForDateValidation = (transfer: unknown): TaskEither<Errors, (Entity & Unassigned)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Unassigned)[]>(unassignedFaresCodec), fromEither);
