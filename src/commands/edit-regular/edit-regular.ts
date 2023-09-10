import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { RegularToEdit, RegularToEditPersist } from './edit-regular.route';

export const editRegular = (fareToEdit: TaskEither<Errors, RegularToEdit>): TaskEither<Errors, RegularToEditPersist> =>
  pipe(fareToEdit, taskEitherMap(applyEdit));

const applyEdit = ({ toEdit, regularToEdit }: RegularToEdit): RegularToEditPersist => ({
  regularToEdit: {
    ...regularToEdit,
    ...toEdit
  }
});
