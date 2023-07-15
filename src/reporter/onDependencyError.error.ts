import { Errors, InfrastructureError } from './HttpReporter';

export const onDependencyError = (messagePrefix: string, error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `${messagePrefix} - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: '503'
    } satisfies InfrastructureError
  ] satisfies Errors;
