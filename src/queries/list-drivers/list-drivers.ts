import { of as taskEitherOf, TaskEither } from 'fp-ts/TaskEither';
import { Driver, Entity } from '../../definitions';
import { Errors } from '../../codecs';

export type ListDriversAdapter = () => TaskEither<Errors, (Driver & Entity)[]>;

export const listDrivers = (serviceCall: ListDriversAdapter): TaskEither<Errors, (Driver & Entity)[]> => serviceCall();

export const mergeProperties = ([cognitoResults, dbResults]: [(Driver & Entity)[], (Driver & Entity)[]]): TaskEither<
  Errors,
  (Driver & Entity)[]
> => taskEitherOf(mergeDriversUsernames(cognitoResults, dbResults));

const mergeDriversUsernames = (
  cognitoDrivers: (Driver & Entity)[],
  persistenceDrivers: (Driver & Entity)[]
): (Driver & Entity)[] =>
  cognitoDrivers.map((cognitoDriver: Driver & Entity): Driver & Entity => {
    const matchingDriverFromDb: (Driver & Entity) | undefined = persistenceDrivers.find(
      (persistenceDriver: Driver & Entity): boolean => persistenceDriver.id === cognitoDriver.id
    );
    return matchingDriverFromDb === undefined ? cognitoDriver : { ...cognitoDriver, username: matchingDriverFromDb.username };
  });
