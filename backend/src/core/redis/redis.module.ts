import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('RedisModule');
        try {
          const { redisStore } = await import('cache-manager-redis-yet');
          const store = await redisStore({
            socket: {
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
              connectTimeout: 3000,
            },
          });
          logger.log('Connected to Redis for caching');
          return { store, ttl: 300_000 };
        } catch {
          logger.warn('Redis unavailable — using in-memory cache');
          return { ttl: 300_000 };
        }
      },
    }),
  ],
})
export class RedisModule {}
