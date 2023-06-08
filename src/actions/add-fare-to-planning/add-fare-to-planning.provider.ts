import * as t from 'io-ts';
import { StringC } from 'io-ts';
import excess from 'io-ts-excess';
import { isFrenchPhoneNumber } from '../../rules/FrenchPhoneNumber.rule';
import { isPositive } from '../../rules/Positive.rule';
import type { FastifyRequest } from 'fastify';
import { isRegisteredClient } from '../../rules/RegisteredClient.rule';
import { withMessage } from 'io-ts-types';

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

export const FareDraftWithoutRules = withMessage(
  t.type({
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
  }),
  (): string => 'Typecheck failed after convertion to core model, this should not happen'
);

const FareDraftRules = t.type({
  client: isRegisteredClient,
  //date: DateFromISOString,
  //departure: isValidAddress,
  //destination: isValidAddress,
  //planning: t.intersection([isDriverPlanning, isUnassigned]),
  phone: isFrenchPhoneNumber
  //time: isLaterTime,
});

export const FareDraft = t.intersection([FareDraftWithoutRules, FareDraftRules]);
export const FareReadyWithoutRules = t.type({
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

const FareReadyBusinessRules = t.type({
  duration: t.intersection([t.Int, isPositive]),
  distance: t.intersection([t.Int, isPositive])
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
