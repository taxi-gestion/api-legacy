import { FareStableStatus } from '../definitions';

export const isOneWay = (fare: { kind: 'one-way' | 'two-way' }): boolean => fare.kind === 'one-way';
export const isTwoWay = (fare: { kind: 'one-way' | 'two-way' }): boolean => fare.kind === 'two-way';
export const isUnassigned = (fare: { status: FareStableStatus }): boolean => fare.status === 'unassigned';

export const isDefinedGuard = <T>(element: T | undefined): element is T => element !== undefined;
