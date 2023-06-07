import * as t from 'io-ts';
import excess from 'io-ts-excess';
import { FrenchPhoneNumber } from '../../types/FrenchPhoneNumber.type';
import { Positive } from '../../types/Positive.type';
import type { FastifyRequest } from 'fastify';

/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/typedef */
const DriveKind = t.keyof({ 'one-way': null, outward: null, 'go-back': null });
const DriveNature = t.keyof({ medical: null, standard: null });

export const AddFareToPlanningTransfer = excess(
  t.type({
    clientIdentity: t.string,
    clientPhone: t.string,
    date: t.string,
    driveFrom: t.string,
    driveKind: DriveKind,
    driveNature: DriveNature,
    driverIdentity: t.union([t.string, t.undefined]),
    driveTo: t.string,
    startTime: t.string
  })
);

export const FareDraftWithoutRules = t.type({
  client: t.string,
  date: t.string,
  departure: t.string,
  destination: t.string,
  driver: t.union([t.string, t.undefined]),
  kind: DriveKind,
  nature: DriveNature,
  phone: t.string,
  status: t.literal('draft'),
  time: t.string
});

const FareDraftBusinessRules = t.type({
  phone: FrenchPhoneNumber
});

export const FareDraft = t.intersection([FareDraftWithoutRules, FareDraftBusinessRules]);
export const FareReadyWithoutRules = t.type({
  client: t.string,
  creator: t.string,
  date: t.string,
  departure: t.string,
  destination: t.string,
  distance: t.number,
  driver: t.union([t.string, t.undefined]),
  duration: t.number,
  kind: DriveKind,
  nature: DriveNature,
  phone: t.string,
  status: t.literal('ready'),
  time: t.string
});

const FareReadyBusinessRules = t.type({
  duration: t.intersection([t.Int, Positive]),
  distance: t.intersection([t.Int, Positive]),
  driver: t.string
});

export const FareReady = t.intersection([FareReadyWithoutRules, FareReadyBusinessRules]);

/* eslint-enable @typescript-eslint/naming-convention,@typescript-eslint/typedef */

export type AddFareToPlanningRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: AddFareToPlanningTransfer;
}>;

export type AddFareToPlanningTransfer = t.TypeOf<typeof AddFareToPlanningTransfer>;
export type FareDraftWithoutRules = t.TypeOf<typeof FareDraftWithoutRules>;
export type FareDraft = t.TypeOf<typeof FareDraft>;
export type FareReadyWithoutRules = t.TypeOf<typeof FareReadyWithoutRules>;
export type FareReady = t.TypeOf<typeof FareReady>;
