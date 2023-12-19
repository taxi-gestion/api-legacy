import { onDatabaseError } from './database.error';
import { Errors, InfrastructureError, isInfrastructureError, ValidationError } from '../codecs';

export const $onInfrastructureOrValidationError =
  (message: string) =>
  (error: unknown): Errors =>
    isInfrastructureError(error as InfrastructureError) ? onDatabaseError(message)(error) : [error as ValidationError];
