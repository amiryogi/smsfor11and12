import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Applies the soft-delete extension to a PrismaClient instance.
 * IMPORTANT: `$extends()` returns a NEW client — the original is NOT mutated.
 */
function withSoftDelete<T extends PrismaClient>(client: T) {
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findUnique({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async count({ args, query }: { args: any; query: any }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async delete({ model, args }: { model: string; args: any }) {
          // Convert hard delete to soft delete
          return (client as Record<string, any>)[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
        async deleteMany({ model, args }: { model: string; args: any }) {
          return (client as Record<string, any>)[model].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
      },
    },
  });
}

function createPrismaClient(connectionUrl: string): PrismaClient {
  // The mariadb npm driver needs allowPublicKeyRetrieval for MySQL 8's
  // caching_sha2_password auth, and the scheme must be mariadb://.
  const url = new URL(connectionUrl);
  url.protocol = 'mariadb:';
  if (!url.searchParams.has('allowPublicKeyRetrieval')) {
    url.searchParams.set('allowPublicKeyRetrieval', 'true');
  }
  const adapter = new PrismaMariaDb(url.toString());
  return new PrismaClient({ adapter });
}

/**
 * PrismaService uses a Proxy so all model access (e.g. this.prisma.student)
 * transparently goes through the soft-delete extended client, while
 * TypeScript still sees PrismaClient methods via the interface merge below.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _primary: PrismaClient;
  private readonly _replicaRaw: PrismaClient;
  private readonly _extended: ReturnType<typeof withSoftDelete>;
  /** Extended read-replica client with soft-delete middleware */
  public readonly replica: ReturnType<typeof withSoftDelete>;

  constructor() {
    this._primary = createPrismaClient(process.env.DATABASE_URL!);
    this._replicaRaw = createPrismaClient(
      process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL!,
    );

    // $extends returns NEW instances — soft-delete aware
    this._extended = withSoftDelete(this._primary);
    this.replica = withSoftDelete(this._replicaRaw);

    // Proxy all unknown property access to the extended client.
    // This means `this.prisma.student.findMany()` → soft-delete filtered.
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Own properties of PrismaService (replica, onModuleInit, etc.)
        if (
          prop in target &&
          (Object.prototype.hasOwnProperty.call(target, prop) ||
            typeof prop === 'symbol' ||
            prop === 'onModuleInit' ||
            prop === 'onModuleDestroy')
        ) {
          return Reflect.get(target, prop, receiver);
        }
        // Forward model accessors, $transaction, $queryRaw, etc. to extended client
        const val = (target._extended as any)[prop];
        return typeof val === 'function' ? val.bind(target._extended) : val;
      },
    }) as any;
  }

  async onModuleInit() {
    await this._primary.$connect();
    await this._replicaRaw.$connect();
  }

  async onModuleDestroy() {
    await this._primary.$disconnect();
    await this._replicaRaw.$disconnect();
  }
}

// Merge interface so TypeScript sees all PrismaClient members on PrismaService
export interface PrismaService extends PrismaClient {}
