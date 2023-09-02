import { Errors, InfrastructureError, isInfrastructureError, ValidationError } from './http-reporter';
import { onDatabaseError } from './database.error';

export const $onInfrastructureOrValidationError =
  (message: string) =>
  (error: unknown): Errors =>
    isInfrastructureError(error as InfrastructureError) ? onDatabaseError(message)(error) : [error as ValidationError];
