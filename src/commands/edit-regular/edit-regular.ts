import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../codecs';
import { RegularToEdit, RegularToEditPersist } from './edit-regular.route';

export const editRegular = (scheduledToEdit: TaskEither<Errors, RegularToEdit>): TaskEither<Errors, RegularToEditPersist> =>
  pipe(scheduledToEdit, taskEitherMap(applyEdit));

const applyEdit = ({ toEdit, regularToEdit }: RegularToEdit): RegularToEditPersist => ({
  regularToEdit: {
    ...regularToEdit,
    ...toEdit
  }
});
