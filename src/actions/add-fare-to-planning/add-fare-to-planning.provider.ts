import * as t from 'io-ts';
import { StringC } from 'io-ts';
import excess from 'io-ts-excess';
import { withMessage } from 'io-ts-types';
import type { FastifyRequest } from 'fastify';
import { isFrenchPhoneNumber } from '../../rules/FrenchPhoneNumber.rule';
import { isPositive } from '../../rules/Positive.rule';
import { isRegisteredClient } from '../../rules/RegisteredClient.rule';
import { isDateISO8601String } from '../../rules/DateISO8601.rule';
import { isTimeISO8601String } from '../../rules/TimeISO8601.rule';

/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/typedef */
const DriveKind = t.keyof({ 'one-way': null, outward: null, 'go-back': null });
const DriveNature = t.keyof({ medical: null, standard: null });
const typecheckFailedMessage = (): string => `Typecheck failed for input`;
const stringTypecheckFailedMessage: StringC = withMessage(t.string, typecheckFailedMessage);

export const AddFareToPlanningTransfer = excess(
  t.type({
    clientIdentity: stringTypecheckFailedMessage,
    clientPhone: stringTypecheckFailedMessage,
    date: stringTypecheckFailedMessage,
    driveFrom: stringTypecheckFailedMessage,
    driveKind: DriveKind,
    driveNature: DriveNature,
    planning: stringTypecheckFailedMessage,
    driveTo: stringTypecheckFailedMessage,
    startTime: stringTypecheckFailedMessage
  })
);

export const FareDraft = t.type({
  client: t.string,
  date: t.string,
  departure: t.string,
  destination: t.string,
  planning: t.string,
  kind: DriveKind,
  nature: DriveNature,
  phone: t.string,
  status: t.literal('draft'),
  time: t.string
});

export const FareDraftRules = t.intersection([
  FareDraft,
  t.type({
    client: isRegisteredClient,
    date: isDateISO8601String,
    //departure: isValidAddress,
    //destination: isValidAddress,
    //planning: t.intersection([isDriverPlanning, isUnassigned]),
    phone: isFrenchPhoneNumber,
    time: isTimeISO8601String
  })
]);

export const FareReady = t.type({
  client: t.string,
  creator: t.string,
  date: t.string,
  departure: t.string,
  destination: t.string,
  distance: t.number,
  planning: t.string,
  duration: t.number,
  kind: DriveKind,
  nature: DriveNature,
  phone: t.string,
  status: t.literal('ready'),
  time: t.string
});

export const FareReadyRules = t.intersection([
  FareReady,
  t.type({
    distance: t.intersection([t.Int, isPositive]),
    duration: t.intersection([t.Int, isPositive])
  })
]);
/* eslint-enable @typescript-eslint/naming-convention,@typescript-eslint/typedef */

export type AddFareToPlanningTransfer = t.TypeOf<typeof AddFareToPlanningTransfer>;
export type FareDraft = t.TypeOf<typeof FareDraft>;
export type FareDraftRules = t.TypeOf<typeof FareDraftRules>;
export type FareReady = t.TypeOf<typeof FareReady>;

export type AddFareToPlanningRequest = FastifyRequest<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Body: AddFareToPlanningTransfer;
}>;
