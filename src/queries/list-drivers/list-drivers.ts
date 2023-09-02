import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/http-reporter';
import { Driver, Entity } from '../../definitions';

export type ListDriversAdapter = () => TaskEither<Errors, (Driver & Entity)[]>;

export const listDrivers = (serviceCall: ListDriversAdapter): TaskEither<Errors, (Driver & Entity)[]> => serviceCall();
