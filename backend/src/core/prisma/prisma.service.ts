import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function createAdapter() {
  return new PrismaMariaDb(process.env.DATABASE_URL!);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public readonly replica: PrismaClient;

  constructor() {
    super({ adapter: createAdapter() });

    this.replica = new PrismaClient({
      adapter: createAdapter(),
    });

    // Apply soft-delete extension to both primary and replica
    this.applySoftDeleteExtension(this);
    this.applySoftDeleteExtension(this.replica);
  }

  private applySoftDeleteExtension(client: PrismaClient): void {
    client.$extends({
      query: {
        $allModels: {
          async findMany({ args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async findUnique({ args, query }) {
            args.where = {
              ...args.where,
              deletedAt: null,
            } as typeof args.where;
            return query(args);
          },
          async count({ args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async delete({ model, args }) {
            // Convert hard delete to soft delete
            return (client as Record<string, any>)[model].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          },
          async deleteMany({ model, args }) {
            return (client as Record<string, any>)[model].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          },
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.replica.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.replica.$disconnect();
  }
}
