import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { EditedToPersist, FaresToEdit } from './edit-fare.route';
import { isOneWay } from '../../domain';
import { toPending } from '../../mappers';

export const editFare = (fareToEdit: TaskEither<Errors, FaresToEdit>): TaskEither<Errors, EditedToPersist> =>
  pipe(fareToEdit, taskEitherMap(applyEdit));

const applyEdit = ({ toEdit, scheduledToEdit, pendingToDelete }: FaresToEdit): EditedToPersist => ({
  scheduledToEdit: {
    ...toEdit,
    status: 'scheduled',
    id: scheduledToEdit.id
  },
  ...(isOneWay(toEdit) ? {} : toPending(toEdit)),
  ...(pendingToDelete === undefined ? {} : pendingToDelete)
});
