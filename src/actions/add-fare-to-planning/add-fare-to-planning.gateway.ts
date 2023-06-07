import * as t from 'io-ts';
import { AddFareToPlanningTransfer, FareDraft, FareDraftWithoutRules } from './add-fare-to-planning.provider';
import type { Validation } from 'io-ts';

import { either } from 'fp-ts';
const { isRight } = either;

export const addFareToPlanningGateway = (addFareToPlanningTransfer: unknown): FareDraft | Error => {
  const transfer: AddFareToPlanningTransfer | Error = addFareToPlanningTransferTypecheck(addFareToPlanningTransfer);
  if (transfer instanceof Error) return transfer;

  const fareDraft: FareDraftWithoutRules | Error = toFareDraft(transfer);
  if (fareDraft instanceof Error) return fareDraft;

  return checkFareDraftRules(fareDraft);
};

const addFareToPlanningTransferTypecheck = (addFareToPlanningTransfer: unknown): AddFareToPlanningTransfer | Error => {
  const typecheck: Validation<AddFareToPlanningTransfer> = AddFareToPlanningTransfer.decode(addFareToPlanningTransfer);
  return isRight(typecheck) ? typecheck.right : new Error('Transfer typecheck failed');
};

const toFareDraft = (fareTransfer: AddFareToPlanningTransfer): FareDraftWithoutRules | Error => {
  const typecheck = FareDraftWithoutRules.decode({
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

const checkFareDraftRules = (fareDraft: FareDraftWithoutRules): FareDraft | Error => {
  const rulecheck: t.Validation<FareDraft> = FareDraft.decode(fareDraft);
  return isRight(rulecheck) ? rulecheck.right : new Error('Domain rulecheck failed');
};
