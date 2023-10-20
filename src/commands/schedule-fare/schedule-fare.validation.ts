import { Type, type as ioType } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor, scheduleScheduledCodec, toScheduleCodec } from '../../codecs';
import { FareToSchedule } from './schedule-fare.route';
import { Errors } from '../../reporter';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { toScheduleRulesCodec } from '../../rules';
import { ScheduleScheduled } from '../../definitions';

export const fareToScheduleValidation = (transfer: unknown): Either<Errors, FareToSchedule> =>
  pipe({ toSchedule: transfer }, externalTypeCheckFor<FareToSchedule>(fareToScheduleCodec), eitherChain(rulesCheck));

export const scheduledFaresValidation = (transfer: unknown): TaskEither<Errors, ScheduleScheduled> =>
  pipe(transfer, externalTypeCheckFor<ScheduleScheduled>(scheduleScheduledCodec), fromEither);

const rulesCheck = (transfer: FareToSchedule): Either<Errors, FareToSchedule> => fareToScheduleRulesCodec.decode(transfer);

const fareToScheduleCodec: Type<FareToSchedule> = ioType({
  toSchedule: toScheduleCodec
});

// eslint-disable-next-line @typescript-eslint/typedef
const fareToScheduleRulesCodec = ioType(
  {
    toSchedule: toScheduleRulesCodec
  },
  'fareToScheduleRulesCodec'
);
