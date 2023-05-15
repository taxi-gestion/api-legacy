import type {PostgresDb} from "@fastify/postgres";

export type PgInfos = {
    databaseSize: number;
    numberOfConnexions: number;
    numberOfActiveConnexions: number;
    listOfAllPublicTables: string;
}

export const getDatabaseInfos = (db: PostgresDb) => async (): Promise<PgInfos | Error>  => {
    const client = await db.connect();
    try {
        const [size, numberOfConnexions,
            numberOfActiveConnexions,
            listOfAllPublicTables] = await Promise.all([
            client.query(getDatabaseSize),
            client.query(getDatabaseNumberOfConnections),
            client.query(getDatabaseNumberOfActiveConnections),
            client.query(listAllTableNames),
        ])

        return {
            databaseSize: size.rows[0],
            numberOfConnexions: numberOfConnexions.rows[0],
            numberOfActiveConnexions: numberOfActiveConnexions.rows[0],
            listOfAllPublicTables: JSON.stringify(listOfAllPublicTables.rows)
        };
    } catch (error: unknown) {
        return new Error((error as Error).message);
    } finally {
        client.release()
    }
}

export const getDatabaseSize: string = `
    SELECT pg_size_pretty(pg_database_size(current_database()));
    `;

export const getDatabaseNumberOfConnections: string = `
    SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database();
    `;

export const getDatabaseNumberOfActiveConnections: string = `
    SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active';
    `;

export const listAllTableNames: string = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
    `;
