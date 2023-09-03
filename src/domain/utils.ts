export const isOneWay = (fare: { kind: 'one-way' | 'two-way' }): boolean => fare.kind === 'one-way';

export const isDefinedGuard = <T>(element: T | undefined): element is T => element !== undefined;
