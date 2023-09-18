import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Driver, Entity } from '../../definitions';
import { externalTypeCheckFor } from '../../codecs';
import { driverEntitiesCodec } from '../../services/aws/cognito/cognito.codec';

export const listDriversValidation = (transfer: unknown): TaskEither<Errors, (Driver & Entity)[]> =>
  pipe(transfer, externalTypeCheckFor<(Driver & Entity)[]>(driverEntitiesCodec), fromEither);
