import {logger} from "./logging.js";
import  {PrismaClient} from '@prisma/client'
export const prismaClient = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});

prismaClient.$on('error', (e) => {
    logger.error(e);
})

prismaClient.$on('warn', (e) => {
    logger.warn(e);
})

prismaClient.$on('info', (e) => {
    logger.info(e);
})

prismaClient.$on('query', (e) => {
    logger.info(e);
})