import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';

/**
 * Either the shared client or an interactive-transaction client. Repository functions accept
 * one so services can compose several of them inside a single `prisma.$transaction`.
 */
export type Db = typeof prisma | Prisma.TransactionClient;

export { prisma };
