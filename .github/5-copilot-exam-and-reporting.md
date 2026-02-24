# Context: NEB Exam Engine, Reporting & Performance

## Domain: NEB +2 School Management ERP

This document outlines the strict domain rules for the Nepalese NEB (Grade 11 & 12) grading system, as well as the database performance strategies (Read Replicas and Redis Caching) for handling heavy reporting loads.

### 🚨 Strict Domain Rules for NEB Grading

1. **Theory vs. Practical:** Subjects often have separate Theory (TH) and Practical (PR) components. Marks must be entered and tracked separately.
2. **Minimum Pass Criteria:** A student MUST secure at least 35% in Theory and 40% in Practical. Failure to do so results in an "NG" (Not Graded) status for that subject.
3. **GPA Calculation:** The NEB GPA scale must be strictly followed:
   - 90 - 100% = A+ (4.0)
   - 80 - 89% = A (3.6)
   - 70 - 79% = B+ (3.2)
   - 60 - 69% = B (2.8)
   - 50 - 59% = C+ (2.4)
   - 40 - 49% = C (2.0)
   - 35 - 39% = D (1.6)
   - Below 35% = NG (Not Graded)
4. **Final Result:** If a student gets "NG" in _any_ subject, their final overall GPA is not calculated, and the final status is "NG".

---

### 🚀 1. The Read-Replica Strategy for Reporting

Complex queries (like generating a school-wide ledger, cross-exam analytics, or bulk marksheets) MUST NEVER run on the primary OLTP database. Copilot must use the Read-Replica Prisma client.

When instructed to "create a report" or "fetch analytics", use this pattern:

```typescript
// src/core/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Read Replica Client
  public readonly replica: PrismaClient;

  constructor() {
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL }, // Primary OLTP
      },
    });

    this.replica = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_REPLICA_URL }, // Read Replica OLAP
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
```

Usage in a Reporting Service:

TypeScript
// src/modules/reports/reports.service.ts
@Injectable()
export class ReportsService {
constructor(private readonly prisma: PrismaService) {}

async getSchoolWideLedger(schoolId: string, examId: string) {
// MUST use this.prisma.replica for heavy aggregations
return this.prisma.replica.student.findMany({
where: { schoolId },
include: {
examResults: { where: { examId } }
}
});
}
}
⚡ 2. The Redis Caching Pattern for Master Data
During result publication, thousands of students will query the same subject lists and grade structures. This data MUST be cached in Redis.

When generating services for AcademicModule (Subjects, Classes, Terms), use this caching pattern:

TypeScript
// src/modules/academic/subject.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SubjectService {
constructor(
private prisma: PrismaService,
@Inject(CACHE_MANAGER) private cacheManager: Cache
) {}

async getSubjectsBySchool(schoolId: string) {
const cacheKey = `school:${schoolId}:subjects`;

    // 1. Check Redis Cache
    const cachedSubjects = await this.cacheManager.get(cacheKey);
    if (cachedSubjects) {
      return cachedSubjects;
    }

    // 2. Fetch from Replica (Master data read)
    const subjects = await this.prisma.replica.subject.findMany({
      where: { schoolId, deletedAt: null },
    });

    // 3. Set Cache (TTL 24 hours)
    await this.cacheManager.set(cacheKey, subjects, 86400000);

    return subjects;

}

async invalidateSubjectCache(schoolId: string) {
await this.cacheManager.del(`school:${schoolId}:subjects`);
}
}
🧮 3. NEB GPA Calculation Utility
When processing exam marks, Copilot must use this exact logic to determine the grade point and letter grade:

TypeScript
// src/modules/exams/utils/neb-grading.util.ts

export interface NebGrade {
letterGrade: string;
gradePoint: number | null;
isNg: boolean;
}

/\*\*

- Calculates NEB Grade based on percentage.
- Note: percentage should be calculated against the specific component (Theory or Practical)
  \*/
  export function calculateNebGrade(percentage: number, isPractical: boolean = false): NebGrade {
  const passingPercentage = isPractical ? 40 : 35;

if (percentage < passingPercentage) return { letterGrade: 'NG', gradePoint: null, isNg: true };

if (percentage >= 90) return { letterGrade: 'A+', gradePoint: 4.0, isNg: false };
if (percentage >= 80) return { letterGrade: 'A', gradePoint: 3.6, isNg: false };
if (percentage >= 70) return { letterGrade: 'B+', gradePoint: 3.2, isNg: false };
if (percentage >= 60) return { letterGrade: 'B', gradePoint: 2.8, isNg: false };
if (percentage >= 50) return { letterGrade: 'C+', gradePoint: 2.4, isNg: false };
if (percentage >= 40) return { letterGrade: 'C', gradePoint: 2.0, isNg: false };
if (percentage >= 35 && !isPractical) return { letterGrade: 'D', gradePoint: 1.6, isNg: false };

return { letterGrade: 'NG', gradePoint: null, isNg: true };
}

---

### Why this file is highly effective for Copilot:

1. **Domain Injection:** It gives the AI the exact, specialized NEB grading rules. Otherwise, Copilot will guess American grading scales (A, B, C, D, F) which will completely ruin the logic.
2. **Explicit Database Routing:** It strictly demonstrates the `this.prisma.replica` pattern, ensuring the AI separates OLTP and OLAP operations during code generation.
3. **Cache Invalidation:** It explicitly pairs the Redis cache retrieval with a cache invalidation method (`invalidateSubjectCache`), prompting Copilot to remember to call it whenever a subject is updated or deleted.
