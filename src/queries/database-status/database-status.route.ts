import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getDatabaseInfos, PgInfos } from './database-status.query';

// eslint-disable-next-line @typescript-eslint/require-await
export const databaseStatusQuery = async (server: FastifyInstance): Promise<void> => {
  server.route({
    method: 'GET',
    url: '/database/status',
    handler: async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const infos: Error | PgInfos = await getDatabaseInfos(server.pg)();
      await reply.send(infos);
    }
  });
};
