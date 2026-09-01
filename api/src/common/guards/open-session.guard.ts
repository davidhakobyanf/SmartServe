import { DiningSession } from "src/entities/dining-session.entity";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SessionsService } from "src/sessions/sessions.service";
import type { Request } from "express";
import { isUUID } from "class-validator";

export interface RequestWithSession extends Request {
  diningSession?: DiningSession;
}

@Injectable()
export class OpenSessionGuard implements CanActivate {
  constructor(private readonly sessionsService: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithSession>();
    const token = (
      req.headers["x-session-token"] as string | undefined
    )?.trim();

    if (!token || !isUUID(token)) {
      throw new UnauthorizedException({
        error: "Missing or invalid session token",
      });
    }

    const session = await this.sessionsService.assertOpen(token);

    req.diningSession = session;
    return true;
  }
}
