import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Errors, externalTypeCheckFor } from '../../codecs';
import { DriverWithOrder } from '../../definitions';
import { orderedDriversCodec } from '../../codecs/domain/driver.codecs';

export const listDriversWithOrderValidation = (transfer: unknown): TaskEither<Errors, DriverWithOrder[]> =>
  pipe(transfer, externalTypeCheckFor<DriverWithOrder[]>(orderedDriversCodec), fromEither);
