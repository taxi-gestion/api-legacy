import { AddFareToPlanningTransfer, FareDraft, FareDraftWithoutRules } from './add-fare-to-planning.provider';
import type { Validation } from 'io-ts';

import { either } from 'fp-ts';
// eslint-disable-next-line @typescript-eslint/typedef
const { isRight } = either;

export const addFareToPlanningGateway = (addFareToPlanningTransfer: unknown): Error | FareDraft => {
  const transfer: AddFareToPlanningTransfer | Error = addFareToPlanningTransferTypecheck(addFareToPlanningTransfer);
  if (transfer instanceof Error) return transfer;

  const fareDraft: Error | FareDraftWithoutRules = toFareDraft(transfer);
  if (fareDraft instanceof Error) return fareDraft;

  return checkFareDraftRules(fareDraft);
};

const addFareToPlanningTransferTypecheck = (addFareToPlanningTransfer: unknown): AddFareToPlanningTransfer | Error => {
  const typecheck: Validation<AddFareToPlanningTransfer> = AddFareToPlanningTransfer.decode(addFareToPlanningTransfer);
  return isRight(typecheck) ? typecheck.right : new Error('Transfer typecheck failed');
};

const toFareDraft = (fareTransfer: AddFareToPlanningTransfer): Error | FareDraftWithoutRules => {
  const typecheck: Validation<FareDraftWithoutRules> = FareDraftWithoutRules.decode({
    client: fareTransfer.clientIdentity,
    date: fareTransfer.date,
    driver: fareTransfer.driverIdentity,
    departure: fareTransfer.driveFrom,
    kind: fareTransfer.driveKind,
    nature: fareTransfer.driveNature,
    phone: fareTransfer.clientPhone,
    status: 'draft',
    time: fareTransfer.startTime,
    destination: fareTransfer.driveTo
  });

  return isRight(typecheck) ? typecheck.right : new Error('Domain typecheck failed');
};

const checkFareDraftRules = (fareDraft: FareDraftWithoutRules): Error | FareDraft => {
  const rulesCheck: Validation<FareDraft> = FareDraft.decode(fareDraft);
  return isRight(rulesCheck) ? rulesCheck.right : new Error('Domain rulesCheck failed');
};
