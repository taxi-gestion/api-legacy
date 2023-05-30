import fastify from 'fastify';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { getDatabaseInfos } from './database/database.reads';
import type { FareByDayRequest, FarePg } from './fares';
import { getFaresByDayPg, toFaresTransfer } from './fares';
import type { PgInfos } from './database/database.reads';

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, nodeProcess: process });

await server.register(postgres, {
  connectionString: process.env.DATABASE_URL ?? ''
});

server.get('/', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/health', async (_request: FastifyRequest, _reply: FastifyReply): Promise<string> => 'OK\n');

server.get('/database-status', async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const infos: Error | PgInfos = await getDatabaseInfos(server.pg)();
  await reply.send(infos);
});

server.get('/fares/:date', async (req: FareByDayRequest, reply) => {
  const fares: FarePg[] | Error = await getFaresByDayPg(server.pg)(req.params.date);

  fares instanceof Error ? reply.send(fares) : reply.send(fares.map(toFaresTransfer));
});

await start({ server, nodeProcess: process });
