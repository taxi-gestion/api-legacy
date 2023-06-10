import { TaskEither, tryCatch as tryCatchTaskEither } from 'fp-ts/lib/TaskEither';
import {FareReady} from "../../actions/add-fare-to-planning/add-fare-to-planning.provider";
import {Errors} from "io-ts";
import {PostgresDb} from "@fastify/postgres";
import {Either} from "fp-ts/Either";


export const faresForTheDateQuery = (_database: PostgresDb) => (_date: Either<Errors, string>): TaskEither<Errors, FareReady[]> => tryCatchTaskEither(
        // eslint-disable-next-line @typescript-eslint/require-await,arrow-body-style
        async (): Promise<FareReady[]> => {

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return [] as FareReady[];
        },
        (error: unknown): Errors =>
            [
                {
                    message: `Error - faresForTheDateQuery: ${(error as Error).message}`,
                    // eslint-disable-next-line id-denylist
                    value: (error as Error).name,
                    context: []
                }
            ] satisfies Errors
    )
