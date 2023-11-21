import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { externalTypeCheckFor, toRecurringCodec, recurringAddedCodec, Errors } from '../../codecs';
import { fromEither, TaskEither } from 'fp-ts/TaskEither';
import { AddRecurring, ToRecurring } from '../../definitions';
import { toRecurringRules } from '../../codecs/domain-rules/fares.rules';

export const recurringToAddValidation = (transfer: unknown): Either<Errors, ToRecurring> =>
  pipe(transfer, externalTypeCheckFor<ToRecurring>(toRecurringCodec), eitherChain(rulesCheck));

export const recurringAddedValidation = (transfer: unknown): TaskEither<Errors, AddRecurring> =>
  pipe(transfer, externalTypeCheckFor<AddRecurring>(recurringAddedCodec), fromEither);

const rulesCheck = (transfer: ToRecurring): Either<Errors, ToRecurring> => toRecurringRules.decode(transfer);
