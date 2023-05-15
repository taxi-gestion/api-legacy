import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import postgres from '@fastify/postgres';
import { closeGracefullyOnSignalInterrupt, start } from './server.utils';
import { getDatabaseInfos } from './database/database.reads';
import type { PgInfos } from './database/database.reads';

const server: FastifyInstance = fastify();

closeGracefullyOnSignalInterrupt({ server, process });

server.register(postgres, {
  connectionString: process.env['DATABASE_URL'] ?? ''
});

server.get('/', async (_request, _reply) => {
  return 'OK\n';
});

server.get('/health', async (_request, _reply) => {
  return 'OK\n';
});

server.get('/database-status', async (_request, reply) => {
  const infos: PgInfos | Error = await getDatabaseInfos(server.pg)();
  reply.send(infos);
});

start({ server, process });
