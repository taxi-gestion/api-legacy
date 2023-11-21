import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { Errors } from '../../codecs';
import { ToRecurring } from '../../definitions';
import { RecurringToAddPersist } from './add-recurring.route';

export const addRecurring = (fareToSchedule: Either<Errors, ToRecurring>): Either<Errors, RecurringToAddPersist> =>
  pipe(fareToSchedule, eitherMap(applyRecurring));

const applyRecurring = (toRecurring: ToRecurring): RecurringToAddPersist => ({
  recurringToCreate: {
    ...toRecurring,
    status: 'recurring'
  }
});
