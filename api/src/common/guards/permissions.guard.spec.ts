import { ForbiddenException } from "@nestjs/common";
import { Permission } from "../auth/permission";
import { PermissionsGuard } from "./permissions.guard";

describe("PermissionsGuard", () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const usersService = { getEffectivePermissions: jest.fn() };
  const user = { id: "user-1" };
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };

  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(reflector as never, usersService as never);
  });

  it("allows an endpoint without required permissions", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it("allows a user who has every required permission", () => {
    reflector.getAllAndOverride.mockReturnValue([
      Permission.ORDERS_VIEW,
      Permission.REVENUE_VIEW,
    ]);
    usersService.getEffectivePermissions.mockReturnValue([
      Permission.ORDERS_VIEW,
      Permission.REVENUE_VIEW,
    ]);

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it("rejects a user and reports the missing permission", () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.REVENUE_VIEW]);
    usersService.getEffectivePermissions.mockReturnValue([
      Permission.ORDERS_VIEW,
    ]);

    expect(() => guard.canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});
