import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import * as either from 'fp-ts/Either';
import { Either } from 'fp-ts/Either';
import { FareDraft, FareReady, FareReadyRules } from './add-fare-to-planning.provider';

export const addFareToPlanningUseCase = (fareDraft: Either<Errors, FareDraft>): Either<Errors, FareReady> =>
  pipe(fareDraft, either.chain(toDomainFareReady), either.chain(typeCheckFareReady), either.chain(ruleCheckFareReady));

//Alternative
//export const addFareToPlanningUseCase = (fareDraft: Either<Errors, FareDraft>): Either<Errors, FareReady> =>
//    pipe(
//        fareDraft,
//        either.chain(toDomainFareReady),
//        either.chain(typeCheck(FareReady)),
//        either.chain(ruleCheck(FareReadyRules))
//    );

const toDomainFareReady = (fareDraft: FareDraft): Either<Errors, FareReady> =>
  either.right({
    ...fareDraft,
    status: 'ready',
    duration: 20,
    distance: 1000,
    creator: 'romain.cambonie@gmail.com'
  });

const typeCheckFareReady = (fareReady: FareReady): Either<Errors, FareReady> => FareReady.decode(fareReady);

const ruleCheckFareReady = (fareReady: FareReady): Either<Errors, FareReady> => FareReadyRules.decode(fareReady);
