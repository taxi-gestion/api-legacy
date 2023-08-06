import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as eitherChain, Either } from 'fp-ts/Either';

import { FareToSchedule } from '../../definitions';
import { fareToScheduleCodec, fareToScheduleRulesCodec } from '../../codecs';

export const scheduleFareValidation = (transfer: unknown): Either<Errors, FareToSchedule> =>
  pipe(transfer, internalTypeCheckForFareToSchedule, eitherChain(rulesCheckForFareToSchedule));
const internalTypeCheckForFareToSchedule = (fareTransfer: unknown): Validation<FareToSchedule> =>
  fareToScheduleCodec.decode(fareTransfer);

const rulesCheckForFareToSchedule = (fareDraft: FareToSchedule): Validation<FareToSchedule> =>
  fareToScheduleRulesCodec.decode(fareDraft);
