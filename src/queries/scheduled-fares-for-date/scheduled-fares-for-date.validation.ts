import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Scheduled } from '../../definitions';
import { externalTypeCheckFor, scheduledFaresCodec } from '../../codecs';

export const scheduledFaresForDateValidation = (transfer: unknown): TaskEither<Errors, (Entity & Scheduled)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Scheduled)[]>(scheduledFaresCodec), fromEither);
