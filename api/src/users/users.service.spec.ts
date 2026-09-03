import { Permission } from "src/common/auth/permission";
import { UsersService } from "./users.service";

describe("UsersService permissions", () => {
  const service = new UsersService({} as never, {} as never, {} as never);

  it("combines role and personal permissions, then removes denied ones", () => {
    const permissions = service.getEffectivePermissions({
      role: {
        code: "manager",
        permissions: [Permission.ORDERS_VIEW, Permission.REVENUE_VIEW],
      },
      permissionAllow: [Permission.TABLES_MANAGE],
      permissionDeny: [Permission.REVENUE_VIEW],
    } as never);

    expect(permissions).toEqual(
      expect.arrayContaining([
        Permission.ORDERS_VIEW,
        Permission.TABLES_MANAGE,
      ]),
    );
    expect(permissions).not.toContain(Permission.REVENUE_VIEW);
  });

  it("always gives every permission to the owner", () => {
    const permissions = service.getEffectivePermissions({
      role: { code: "owner", permissions: [] },
      permissionAllow: [],
      permissionDeny: [Permission.REVENUE_VIEW],
    } as never);

    expect(permissions).toEqual(expect.arrayContaining(Object.values(Permission)));
  });
});
