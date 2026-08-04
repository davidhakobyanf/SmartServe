import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/entities/user.entity";
import { AuthenticatedRequest } from "../guards/jwt-auth.guard";



export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): User => {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user;
    }
)