import type { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify';
import { Task } from 'fp-ts/Task';
import HttpReporter, { Errors } from './reporter/http-reporter';
import { left as eitherLeft } from 'fp-ts/Either';

type ServerAndProcess = {
  // eslint-disable-next-line no-undef
  nodeProcess: NodeJS.Process;
  server: FastifyInstance;
};

export const onSuccessfulTaskWith =
  (reply: FastifyReply) =>
  <T>(payload: T): Task<void> =>
  async (): Promise<void> =>
    reply.code(200).send(payload);

export const onErroredTask =
  (reply: FastifyReply) =>
  (errors: Errors): Task<void> =>
  async (): Promise<void> =>
    reply.code(500).send(HttpReporter.report(eitherLeft(errors)));

export const closeGracefullyOnSignalInterrupt = ({ nodeProcess, server }: ServerAndProcess): void => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const closeGracefully: (signal: number | string | undefined) => void = closeGracefullyHandler({ server, nodeProcess });
  nodeProcess.once('SIGINT', closeGracefully);
  nodeProcess.once('SIGTERM', closeGracefully);
};

export const closeGracefullyHandler =
  ({ nodeProcess, server }: ServerAndProcess) =>
  async (signal: number | string | undefined): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`*^!@4=> Received signal to terminate: ${signal}`);

    await server.close();
    // await other things we should cleanup nicely
    nodeProcess.kill(nodeProcess.pid, signal);
  };

export const start = async ({ server, nodeProcess }: ServerAndProcess): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await server.listen(
      { port: parseInt(nodeProcess.env['PORT'] ?? '', 10), host: '0.0.0.0' },
      (error: Error | null, address: string): void => {
        if (error != null) {
          // eslint-disable-next-line no-console
          console.error(error);
          nodeProcess.exit(1);
        }
        // eslint-disable-next-line no-console
        console.log(`Server listening at ${address}`);
      }
    );
    // eslint-disable-next-line no-console
    console.log(`*^!@4=> Process id: ${nodeProcess.pid}`);
  } catch (error: unknown) {
    server.log.error(error);
    nodeProcess.exit(1);
  }
};
