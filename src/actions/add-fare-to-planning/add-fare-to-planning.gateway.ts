import type { Errors, Validation } from 'io-ts';
import { pipe } from 'fp-ts/function';
import { chain as chainEither, Either } from 'fp-ts/Either';
import { AddFareToPlanningTransfer, FareDraft, FareDraftRules } from './add-fare-to-planning.provider';

export const addFareToPlanningGateway = (addFareToPlanning: unknown): Either<Errors, FareDraft> =>
  pipe(typeCheckTransfer(addFareToPlanning), chainEither(toDomainFareDraft), chainEither(ruleCheckDomain));

//Alternative
//export const addFareToPlanningGateway = (addFareToPlanning: unknown): Either<Errors, FareDraft> =>
//    pipe(
//        typeCheck(AddFareToPlanningTransfer)(addFareToPlanning),
//        chain(toDomainFareDraft),
//        chain(ruleCheck(FareDraftRules))
//    );

const typeCheckTransfer = (addFareToPlanningTransfer: unknown): Validation<AddFareToPlanningTransfer> =>
  AddFareToPlanningTransfer.decode(addFareToPlanningTransfer);
const toDomainFareDraft = (fareTransfer: AddFareToPlanningTransfer): Validation<FareDraft> =>
  FareDraft.decode({
    client: fareTransfer.clientIdentity,
    date: fareTransfer.date,
    planning: fareTransfer.planning,
    departure: fareTransfer.driveFrom,
    kind: fareTransfer.driveKind,
    nature: fareTransfer.driveNature,
    phone: fareTransfer.clientPhone,
    status: 'draft',
    time: fareTransfer.startTime,
    destination: fareTransfer.driveTo
  });

const ruleCheckDomain = (fareDraft: FareDraft): Validation<FareDraftRules> => FareDraftRules.decode(fareDraft);
