import type { FarePg } from './fares.reads';
import { toFaresTransfer } from './fares.reads';

describe('Fares reads', () => {
  it('should convert postgre model to transfer model', () => {
    const payload: FarePg = {
      rid: '#58:0',
      clientidentity: 'Mr Gache - mr-gache@client.com',
      driveridentity: null,
      phone: '+33 6 74 06 64 52',
      created_at: '1551717982000',
      creator: 'admin@taxi.com',
      date: '2019-03-05',
      distance: '13,0 km',
      duration: '22',
      isreturn: 'false',
      locked: 'true',
      meters: '13046',
      recurrent: 'false',
      status: 'subcontracted',
      subcontractor: 'chris',
      time: '09:00',
      timestamp: '1551776400',
      updated_at: '1553597008000',
      weeklyrecurrence: '0',
      drive_rid: '#55:639',
      drivenature: 'medical',
      drive_from: '9 Chemin du Vincent, 69510 Messimy, France',
      drive_to: '165 Chemin du Grand Revoyet, 69310 Pierre-Bénite, France',
      drivecomment: null,
      distanceoverride: null,
      name: 'lyon sud',
      clientcomment: null
    };

    expect(toFaresTransfer(payload)).toStrictEqual({
      clientComment: undefined,
      clientIdentity: 'Mr Gache - mr-gache@client.com',
      clientPhone: '+33 6 74 06 64 52',
      createdAt: '1551717982000',
      creatorIdentity: 'admin@taxi.com',
      date: '2019-03-05',
      driveComment: undefined,
      driveDistanceInMeters: '13046',
      driveDistanceOverride: undefined,
      driveFrom: '9 Chemin du Vincent, 69510 Messimy, France',
      driveKind: 'outward',
      driveName: 'lyon sud',
      driveNature: 'medical',
      driveRid: '#55:639',
      driveTo: '165 Chemin du Grand Revoyet, 69310 Pierre-Bénite, France',
      driverIdentity: undefined,
      duration: '22',
      rid: '#58:0',
      startTime: '09:00',
      status: 'subcontracted',
      subcontractorIdentity: 'chris',
      updatedAt: '1553597008000',
      weeklyRecurrence: '0'
    });
  });
});
