Execution Plan (Phase by Phase)
Phase What Why First Docs Used

1. Scaffold & Infra Root files (.nvmrc, docker-compose.yml, .env.example), scaffold backend/ with NestJS CLI, scaffold frontend/ with Vite, install all dependencies Everything depends on this 7
2. Core Module PrismaService (primary + replica + soft-delete extension), RedisModule, StorageService (S3), AuditService, env validation, global exception filter, response interceptor, validation pipe Every domain module imports Core 2, 4, 7, 11
3. Auth Module JWT strategy, login/refresh/logout, guards (JwtAuthGuard, RolesGuard, SchoolIsolationGuard), rate limiting Every protected route needs auth 6, 9
4. Prisma Schema + Migration Full schema.prisma from doc 8, run first migration, seed script Domain services need tables 8, 7
5. Domain Modules Users → Schools → Academic → Students → Exams → Finance → Notifications → Reports (in dependency order) Each builds on the previous 3, 5, 9
6. Frontend (Web) Vite + React scaffold, API client, auth store, TanStack Query hooks, routing, page components Consumes the API from Phase 5 10
7. Mobile App Expo scaffold, NativeWind setup, navigation, API client, screens, components Consumes the same API 13–16
8. Testing Unit tests, E2E tests, test factories Validates everything above 12
