import { Type, type as ioType } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor, scheduleScheduledCodec, toScheduledCodec, Errors } from '../../codecs';
import { FareToSchedule } from './schedule-fare.route';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { ScheduleScheduled } from '../../definitions';
import { toScheduledRules } from '../../codecs/domain-rules/fares.rules';

export const fareToScheduleValidation = (transfer: unknown): Either<Errors, FareToSchedule> =>
  pipe({ toSchedule: transfer }, externalTypeCheckFor<FareToSchedule>(fareToScheduleCodec), eitherChain(rulesCheck));

export const scheduledFaresValidation = (transfer: unknown): TaskEither<Errors, ScheduleScheduled> =>
  pipe(transfer, externalTypeCheckFor<ScheduleScheduled>(scheduleScheduledCodec), fromEither);

const rulesCheck = (transfer: FareToSchedule): Either<Errors, FareToSchedule> => fareToScheduleRules.decode(transfer);

const fareToScheduleCodec: Type<FareToSchedule> = ioType({
  toSchedule: toScheduledCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const fareToScheduleRules = ioType(
  {
    toSchedule: toScheduledRules
  },
  'fareToScheduleRules'
);
