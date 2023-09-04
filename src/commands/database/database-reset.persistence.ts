import { TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';

export const resetDatabaseStructure = (database: PostgresDb): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(dropAndRecreateTables(database)(), onDatabaseError('alterDB'));

const dropAndRecreateTables = (database: PostgresDb) => () => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await alterDbQueries(client);
  } finally {
    client.release();
  }
};

const alterDbQueries = async (client: PoolClient): Promise<QueryResult> => client.query(createRegularsTableQuery);

const createRegularsTableQuery: string = `
DROP TABLE IF EXISTS regulars;
CREATE TABLE regulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    civility TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    phones TEXT[] DEFAULT NULL,
    home JSONB DEFAULT NULL,
    destinations JSONB[] DEFAULT NULL,
    commentary TEXT DEFAULT NULL,
    subcontracted_client TEXT DEFAULT NULL
);`;

//const addStatusToPendingReturnsQueryString: string = `ALTER TABLE pending_returns ADD COLUMN status TEXT NOT NULL DEFAULT 'pending-return'`;

//const dropAndRecreateTablesQueries = async (client: PoolClient): Promise<QueryResult> =>
//  client.query(/*dropAndRecreateTablesQueryString*/);

/*const dropAndRecreateTablesQueryString: string = `
DROP TABLE IF EXISTS scheduled_fares;
     CREATE TABLE scheduled_fares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        passenger TEXT NOT NULL,
        datetime TEXT NOT NULL,
        departure JSON NOT NULL,
        destination JSON NOT NULL,
        distance NUMERIC NOT NULL,
        driver TEXT NOT NULL,
        duration NUMERIC NOT NULL,
        kind TEXT NOT NULL,
        nature TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL
    );

    DROP TABLE IF EXISTS subcontracted_fares;
     CREATE TABLE subcontracted_fares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subcontractor TEXT NOT NULL,
        passenger TEXT NOT NULL,
        datetime TEXT NOT NULL,
        departure JSON NOT NULL,
        destination JSON NOT NULL,
        distance NUMERIC NOT NULL,
        duration NUMERIC NOT NULL,
        kind TEXT NOT NULL,
        nature TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL
    );

    DROP TABLE IF EXISTS pending_returns;
     CREATE TABLE pending_returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        passenger TEXT NOT NULL,
        datetime TEXT NOT NULL,
        departure JSON NOT NULL,
        destination JSON NOT NULL,
        driver TEXT,
        kind TEXT NOT NULL,
        nature TEXT NOT NULL,
        phone TEXT NOT NULL,
        outward_fare_id UUID NOT NULL

    );
    DROP TABLE IF EXISTS passengers;
     CREATE TABLE passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        phone TEXT NOT NULL
    );
    `;*/
