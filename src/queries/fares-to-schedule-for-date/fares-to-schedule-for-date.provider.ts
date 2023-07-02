import { FastifyRequest } from 'fastify';

export type FareToScheduleForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;
