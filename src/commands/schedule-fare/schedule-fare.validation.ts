import { Type, type as ioType, union as ioUnion } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import {
  externalTypeCheckFor,
  pendingReturnCodec,
  scheduledFareCodec,
  toScheduleCodec,
  toScheduleRulesCodec
} from '../../codecs';
import { FaresScheduled, FareToSchedule } from './schedule-fare.route';
import { Errors } from '../../reporter/http-reporter';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';

export const fareToScheduleValidation = (transfer: unknown): Either<Errors, FareToSchedule> =>
  pipe(transfer, externalTypeCheckFor<FareToSchedule>(fareToScheduleCodec), eitherChain(rulesCheck));

export const scheduledFaresValidation = (transfer: unknown): TaskEither<Errors, FaresScheduled> =>
  pipe(transfer, externalTypeCheckFor<FaresScheduled>(fareScheduledCodec), fromEither);

const rulesCheck = (transfer: FareToSchedule): Either<Errors, FareToSchedule> => fareToScheduleRulesCodec.decode(transfer);

const fareToScheduleCodec: Type<FareToSchedule> = ioType({
  toSchedule: toScheduleCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const fareToScheduleRulesCodec = ioType({
  toSchedule: toScheduleRulesCodec
});

const fareScheduledCodec: Type<FaresScheduled> = ioUnion([
  ioType({
    scheduledCreated: scheduledFareCodec
  }),
  ioType({
    scheduledCreated: scheduledFareCodec,
    pendingCreated: pendingReturnCodec
  })
]);
