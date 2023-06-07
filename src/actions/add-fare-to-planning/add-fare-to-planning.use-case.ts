import { FareDraft, FareReady, FareReadyWithoutRules } from './add-fare-to-planning.provider';
import type { Validation } from 'io-ts';

import { either } from 'fp-ts';
// eslint-disable-next-line @typescript-eslint/typedef
const { isRight, isLeft } = either;

export const addFareToPlanningUseCase = (fareDraft: FareDraft): Error | FareReady => {
  const fareReady: Validation<FareReadyWithoutRules> = FareReadyWithoutRules.decode(toReadyFare(fareDraft));
  if (isLeft(fareReady)) return new Error('FareReady typecheck failure');

  const rulesCheck: Validation<FareReady> = FareReady.decode(fareReady.right);

  return isRight(rulesCheck) ? rulesCheck.right : new Error('FareReady rulesCheck failure');
};

const toReadyFare = (fareDraft: FareDraft): FareReadyWithoutRules => ({
  ...fareDraft,
  status: 'ready',
  duration: 20,
  distance: 1000,
  creator: 'romain.cambonie@gmail.com',
  driver: 'unassigned'
});
