
import { PrismaClient } from '@prisma/client';

// Exporto ambas formas para que no falle ni con import default ni con named
export const prisma = new PrismaClient();
export default prisma;
