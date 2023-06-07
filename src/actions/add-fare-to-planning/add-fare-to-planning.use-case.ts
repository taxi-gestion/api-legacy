import { FareDraft, FareReady, FareReadyWithoutRules } from './add-fare-to-planning.provider';
import { either } from 'fp-ts';
import type { Validation } from 'io-ts';

const { isRight, isLeft } = either;

export const addFareToPlanningUseCase = (fareDraft: FareDraft): FareReady | Error => {
  const fareReady: Validation<FareReadyWithoutRules> = FareReadyWithoutRules.decode(toReadyFare(fareDraft));
  if (isLeft(fareReady)) return new Error('FareReady typecheck failure');

  const rulecheck: Validation<FareReady> = FareReady.decode(fareReady.right);

  return isRight(rulecheck) ? rulecheck.right : new Error('FareReady rulecheck failure');
};

const toReadyFare = (fareDraft: FareDraft): FareReadyWithoutRules => ({
  ...fareDraft,
  status: 'ready',
  duration: 20,
  distance: 1000,
  creator: 'romain.cambonie@gmail.com',
  driver: 'unassigned'
});
