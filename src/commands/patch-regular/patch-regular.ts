import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../codecs';
import { RegularToPatch, RegularToPatchPersist } from './patch-regular.route';

export const patchRegular = (regularToPatch: TaskEither<Errors, RegularToPatch>): TaskEither<Errors, RegularToPatchPersist> =>
  pipe(regularToPatch, taskEitherMap(applyPatch));

const applyPatch = ({ toPatch, regularToPatch }: RegularToPatch): RegularToPatchPersist =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    toPatch: {
      id: regularToPatch.id,
      ...('phones' in toPatch && toPatch.phones !== undefined
        ? { phones: [...(regularToPatch.phones ?? []), ...toPatch.phones] }
        : {}),
      ...('waypoints' in toPatch && toPatch.waypoints !== undefined
        ? { waypoints: [...(regularToPatch.waypoints ?? []), ...toPatch.waypoints] }
        : {})
    }
  } as RegularToPatchPersist);
