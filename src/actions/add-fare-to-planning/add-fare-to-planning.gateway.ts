import { AddFareToPlanningTransfer, FareDraft, FareDraftWithoutRules } from './add-fare-to-planning.provider';
import type { Errors, Validation } from 'io-ts';

import { chain, Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

export const addFareToPlanningGateway = (addFareToPlanningTransfer: unknown): Either<Errors, FareDraftWithoutRules> =>
  pipe(
    AddFareToPlanningTransfer.decode(addFareToPlanningTransfer),
    chain(toFareDraftWithoutRules),
    // eslint-disable-next-line @typescript-eslint/unbound-method
    chain(FareDraft.decode)
  );

const toFareDraftWithoutRules = (fareTransfer: AddFareToPlanningTransfer): Validation<FareDraftWithoutRules> =>
  FareDraftWithoutRules.decode({
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
