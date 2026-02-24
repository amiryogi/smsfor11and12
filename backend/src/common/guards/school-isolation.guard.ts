import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Ensures the resource being accessed belongs to the authenticated user's school.
 * The controller must pass `schoolId` as a route param or service must verify ownership.
 * This guard checks that `req.params.schoolId` (if present) matches `req.user.schoolId`.
 */
@Injectable()
export class SchoolIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN can access any school
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // If schoolId is in route params, verify it matches the user's school
    const paramSchoolId = request.params?.schoolId;
    if (paramSchoolId && paramSchoolId !== user.schoolId) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
