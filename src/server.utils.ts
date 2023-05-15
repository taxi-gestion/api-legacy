import type {FastifyInstance} from "fastify";


type ServerAndProcess = {
    process: NodeJS.Process,
    server: FastifyInstance
}

export const closeGracefullyOnSignalInterrupt = ({process, server}: ServerAndProcess) => {
    const closeGracefully = closeGracefullyHandler({server, process});
    process.once('SIGINT', closeGracefully);
    process.once('SIGTERM', closeGracefully);
}

export const closeGracefullyHandler = ({process, server}: ServerAndProcess) => async (signal: string | number | undefined) => {
    console.log(`*^!@4=> Received signal to terminate: ${signal}`)

    await server.close()
    // await other things we should cleanup nicely
    process.kill(process.pid, signal);
}

export const start = async ({ server, process }: ServerAndProcess) => {
    const PORT: number = parseInt(process.env['PORT'] ?? "");
    const HOST: string =  "0.0.0.0";

    try {
        await server.listen({ port: PORT, host: HOST }, (err, address) => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            console.log(`Server listening at ${address}`)
        });
        console.log(`*^!@4=> Process id: ${process.pid}`)
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}