import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { EditedToPersist, FaresToEdit } from './edit-scheduled.route';
import { isOneWay } from '../../domain';
import { toPending } from '../../mappers';

export const editScheduled = (scheduledToEdit: TaskEither<Errors, FaresToEdit>): TaskEither<Errors, EditedToPersist> =>
  pipe(scheduledToEdit, taskEitherMap(applyEdit));

const applyEdit = ({ toEdit, scheduledToEdit, pendingToDelete }: FaresToEdit): EditedToPersist => ({
  scheduledToEdit: {
    ...toEdit,
    status: 'scheduled',
    id: scheduledToEdit.id
  },
  pendingToCreate: isOneWay(toEdit) ? undefined : toPending(toEdit),
  pendingToDelete
});
