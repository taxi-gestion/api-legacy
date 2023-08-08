import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { Driver } from '../../definitions';

export type ListDriversAdapter = () => TaskEither<Errors, Driver[]>;

export const listDrivers = (serviceCall: ListDriversAdapter): TaskEither<Errors, Driver[]> => serviceCall();
