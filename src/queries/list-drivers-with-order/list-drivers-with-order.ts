import { of as taskEitherOf, TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter';
import { Driver, DriverWithOrder, Entity } from '../../definitions';

export type ListDriversAdapter = () => TaskEither<Errors, (Driver & Entity)[]>;

export const listDriversFromIdentityProvider = (serviceCall: ListDriversAdapter): TaskEither<Errors, (Driver & Entity)[]> =>
  serviceCall();

export const mergeProperties = ([cognitoResults, dbResults]: [(Driver & Entity)[], DriverWithOrder[]]): TaskEither<
  Errors,
  DriverWithOrder[]
> => taskEitherOf(mergeDriversProperties(cognitoResults, dbResults));

export const mergeDriversProperties = (
  cognitoDrivers: (Driver & Entity)[],
  persistenceDrivers: DriverWithOrder[]
): DriverWithOrder[] =>
  cognitoDrivers.reduce(
    (acc: DriverWithOrder[], cognitoDriver: Driver & Entity): DriverWithOrder[] =>
      mergeDriver(acc, cognitoDriver, persistenceDrivers),
    []
  );

const mergeDriver = (
  acc: DriverWithOrder[],
  cognitoDriver: Driver & Entity,
  persistenceDrivers: DriverWithOrder[]
): DriverWithOrder[] => {
  const matchingDriverFromDb: DriverWithOrder | undefined = persistenceDrivers.find(
    (persistenceDriver: DriverWithOrder): boolean => persistenceDriver.id === cognitoDriver.id
  );

  if (matchingDriverFromDb !== undefined) {
    acc.push({ ...cognitoDriver, ...matchingDriverFromDb });
  }

  return acc;
};
