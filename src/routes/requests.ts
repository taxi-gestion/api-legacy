import { FastifyRequest } from 'fastify';
import { FareToScheduleTransfer } from '../commands/schedule-fare/schedule-fare.definitions';
import { ReturnToAffectTransfer } from '../commands/affect-return/affect-return.definitions';

export type FareToScheduleRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: FareToScheduleTransfer;
}>;

export type ReturnToAffectRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: ReturnToAffectTransfer;
}>;

export type FareForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;

export type ReturnsToAffectForDateRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Params: {
    date: string;
  };
}>;
