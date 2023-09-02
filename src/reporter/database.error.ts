import { Errors, InfrastructureError } from './http-reporter';

export const onDatabaseError =
  (messagePrefix: string) =>
  (error: unknown): Errors =>
    [
      {
        isInfrastructureError: true,
        message: `${messagePrefix} - database error - ${(error as Error).message}`,
        // eslint-disable-next-line id-denylist
        value: (error as Error).name,
        stack: (error as Error).stack ?? 'no stack available',
        code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
      } satisfies InfrastructureError
    ] satisfies Errors;
