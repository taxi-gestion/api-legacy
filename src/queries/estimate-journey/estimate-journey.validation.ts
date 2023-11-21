import { pipe } from 'fp-ts/function';
import { JourneyTransfer, journeyTransferCodec } from './estimate-journey.codec';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { fromEither } from 'fp-ts/TaskEither';
import { Errors, externalTypeCheckFor, journeyCodec } from '../../codecs';
import { Journey } from '../../definitions';
import { chain as eitherChain, Either } from 'fp-ts/Either';
import { journeyRules } from '../../codecs/domain-rules/journey.rules';

export const estimateJourneyValidation = (transfer: unknown): TaskEither<Errors, Journey> =>
  pipe(
    transfer,
    externalTypeCheckFor<JourneyTransfer>(journeyTransferCodec),
    eitherChain(internalTypeCheckForJourney),
    eitherChain(rulesCheckForJourney),
    fromEither
  );

const internalTypeCheckForJourney = (transfer: JourneyTransfer): Either<Errors, Journey> => journeyCodec.decode(transfer);

const rulesCheckForJourney = (journey: Journey): Either<Errors, Journey> => journeyRules.decode(journey);
