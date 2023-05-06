import type { PostgresDb } from '@fastify/postgres';
import type { FastifyRequest } from 'fastify';

export type FareByDayRequest = FastifyRequest<{
  Params: {
    date: string;
  };
}>;

export const getFaresByDayPg =
  (db: PostgresDb) =>
  async (date: string): Promise<FarePg[] | Error> => {
    const client = await db.connect();
    try {
      const { rows } = await client.query(fareByDayRead, [date]);

      return rows ?? [];
    } catch (error: unknown) {
      return new Error((error as Error).message);
    } finally {
      client.release();
    }
  };

export const fareByDayRead: string = `
    SELECT 
        fares.rid,
        clients.identity AS clientidentity,
        drivers.identity AS driveridentity,
        clients.phone,
        fares.created_at,
        fares.creator,
        fares.date,
        fares.distance,
        fares.duration,
        fares.isreturn,
        fares.locked,
        fares.meters,
        fares.recurrent,
        fares.status,
        fares.subcontractor,
        fares."time",
        fares."timestamp",
        fares.updated_at,
        fares.weeklyrecurrence,
        fares.drive_rid,
        drives.nature AS drivenature,
        drives.drive_from,
        drives.drive_to,
        drives.comment AS drivecomment,
        drives.distanceoverride,
        drives.name,
        clients.comment AS clientcomment
    FROM (public.fares fares
     LEFT JOIN public.drives drives ON ((fares.drive_rid = drives.rid))
     LEFT JOIN public.users clients ON ((drives.client_rid = clients.rid))
     LEFT JOIN public.drivers drivers ON ((fares.driver_rid = drivers.rid))
     )
    WHERE (fares.date =$1);
    `;

export type FarePg = {
  rid: string;
  clientidentity: string;
  driveridentity: string | null;
  phone: string;
  created_at: string;
  creator: string;
  date: string;
  distance: string;
  duration: string;
  isreturn: string;
  locked: string;
  meters: string;
  recurrent: string;
  status: string;
  subcontractor: string;
  time: string;
  timestamp: string;
  updated_at: string;
  weeklyrecurrence: string;
  drive_rid: string;
  drivenature: string;
  drive_from: string;
  drive_to: string;
  drivecomment: string | null;
  distanceoverride: string | null;
  name: string;
  clientcomment: string | null;
};

export type FareTransfer = {
  clientComment: string | undefined;
  clientIdentity: string;
  clientPhone: string;
  createdAt: string;
  creatorIdentity: string;
  date: string;
  driveDistanceInMeters: string;
  driveComment: string | undefined;
  driveDistanceOverride: string | undefined;
  driveFrom: string;
  driveKind: 'one-way' | 'outward' | 'return';
  driveName: string;
  driveNature: 'medical' | 'standard';
  driveRid: string;
  driverIdentity: string | undefined;
  driveTo: string;
  duration: string;
  rid: string;
  startTime: string;
  status: string;
  subcontractorIdentity: string | undefined;
  updatedAt: string;
  weeklyRecurrence: string;
};

export const toFaresTransfer = (fare: FarePg): FareTransfer => {
  return {
    clientComment: fare.drivecomment ?? undefined,
    clientIdentity: fare.clientidentity,
    clientPhone: fare.phone,
    createdAt: fare.created_at,
    creatorIdentity: fare.creator,
    date: fare.date,
    driveComment: fare.drivecomment ?? undefined,
    driveDistanceInMeters: fare.meters,
    driveDistanceOverride: fare.distanceoverride ?? undefined,
    driveFrom: fare.drive_from,
    driveKind: fare.isreturn === 'false' ? 'outward' : 'return',
    driveName: fare.name,
    driveNature: fare.drivenature as 'medical' | 'standard',
    driveRid: fare.drive_rid,
    driveTo: fare.drive_to,
    driverIdentity: fare.driveridentity ?? undefined,
    duration: fare.duration,
    rid: fare.rid,
    startTime: fare.time,
    status: fare.status,
    subcontractorIdentity: fare.subcontractor ?? undefined,
    updatedAt: fare.updated_at,
    weeklyRecurrence: fare.weeklyrecurrence
  };
};
