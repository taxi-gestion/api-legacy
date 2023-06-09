import { FareDraft, FareReady, FareReadyRules } from './add-fare-to-planning.provider';
import { chain, Either, right } from 'fp-ts/Either';
import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';

export const addFareToPlanningUseCase = (fareDraft: Either<Errors, FareDraft>): Either<Errors, FareReady> =>
  pipe(fareDraft, chain(toDomainFareReady), chain(typeCheckFareReady), chain(ruleCheckFareReady));

//Alternative
//export const addFareToPlanningUseCase = (fareDraft: Either<Errors, FareDraft>): Either<Errors, FareReady> =>
//    pipe(
//        fareDraft,
//        chain(toDomainFareReady),
//        chain(typeCheck(FareReady)),
//        chain(ruleCheck(FareReadyRules))
//    );

const toDomainFareReady = (fareDraft: FareDraft): Either<Errors, FareReady> =>
  right({
    ...fareDraft,
    status: 'ready',
    duration: 20,
    distance: 1000,
    creator: 'romain.cambonie@gmail.com'
  });

const typeCheckFareReady = (fareReady: FareReady): Either<Errors, FareReady> => FareReady.decode(fareReady);

const ruleCheckFareReady = (fareReady: FareReady): Either<Errors, FareReady> => FareReadyRules.decode(fareReady);
