// eslint-disable-next-line @typescript-eslint/no-shadow
import { describe, it, expect } from 'vitest';
import { mergeDriversProperties } from './list-drivers-with-order';
import { Driver, DriverWithOrder, Entity } from '../../definitions';

describe('mergeDriversProperties', (): void => {
  const cognitoDrivers: (Driver & Entity)[] = [
    { id: '1', username: 'identifier1', identifier: 'identifier1' },
    { id: '2', username: 'identifier2', identifier: 'identifier2' },
    { id: '4', username: 'identifier4', identifier: 'identifier4' }
  ];

  const persistenceDrivers: DriverWithOrder[] = [
    { id: '1', username: 'username1', identifier: 'identifier1', displayOrder: 4 },
    { id: '2', username: 'username2', identifier: 'identifier2', displayOrder: 2 },
    { id: '3', username: 'username3', identifier: 'identifier3', displayOrder: 1 },
    { id: '4', username: 'username4', identifier: 'identifier4', displayOrder: 6 }
  ];

  it('should return an array of merged driver objects with only the cognito entries with merged properties from persistence', (): void => {
    expect(mergeDriversProperties(cognitoDrivers, persistenceDrivers)).toStrictEqual([
      { id: '1', username: 'username1', identifier: 'identifier1', displayOrder: 4 },
      { id: '2', username: 'username2', identifier: 'identifier2', displayOrder: 2 },
      { id: '4', username: 'username4', identifier: 'identifier4', displayOrder: 6 }
    ]);
  });
});
