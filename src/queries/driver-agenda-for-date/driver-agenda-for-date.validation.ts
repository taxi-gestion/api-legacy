import { Errors, externalTypeCheckFor, scheduledFaresCodec } from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Scheduled } from '../../definitions';
import { string as ioString, type as ioType, Type } from 'io-ts';
import { Either } from 'fp-ts/Either';
import { DriverIdAndDate } from './driver-agenda-for-date.route';

export const driverAgendaValidation = (transfer: unknown): Either<Errors, DriverIdAndDate> =>
  pipe(transfer, externalTypeCheckFor<DriverIdAndDate>(driverAgendaCodec));

export const driverAgendaForDateValidation = (transfer: unknown): TaskEither<Errors, (Entity & Scheduled)[]> =>
  pipe(transfer, externalTypeCheckFor<(Entity & Scheduled)[]>(scheduledFaresCodec), fromEither);

const driverAgendaCodec: Type<DriverIdAndDate> = ioType({
  date: ioString,
  driverId: ioString
});
