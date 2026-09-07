import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { HttpException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { UserAuthenticationService } from "../users/user-authentication.service";
import { StaffManagementService } from "../users/staff-management.service";
import { UsersRepository } from "../users/users.repository";
import { Permission } from "../common/auth/permission";
import { UserStatus } from "../common/auth/user-status";
import { ID, userFixture } from "./fixtures";

describe("User workflows before/after refactoring", () => {
  const repo = { findOne: jest.fn(), save: jest.fn(async (user: unknown) => user), create: jest.fn((user: unknown) => user), count: jest.fn() };
  const roles = { findOne: jest.fn() };
  const jwt = new JwtService({ secret: "workflow-test" });
  let service: UsersService;
  let actor = userFixture();
  let password: string;

  beforeAll(async () => { password = await bcrypt.hash("Secret1!", 4); });
  beforeEach(() => {
    jest.clearAllMocks();
    actor = userFixture(); actor.password = password;
    repo.findOne.mockResolvedValue(actor);
    roles.findOne.mockResolvedValue(actor.role);
    repo.count.mockResolvedValue(1);
    service = new UsersService(
      new UserAuthenticationService(repo as never, jwt),
      new StaffManagementService(repo as never, roles as never),
      new UsersRepository(repo as never),
    );
  });

  async function errorOf(action: Promise<unknown>) {
    try { await action; throw new Error("Expected an HTTP exception"); }
    catch (error) {
      if (!(error instanceof HttpException)) throw error;
      return { status: error.getStatus(), body: error.getResponse() };
    }
  }

  it("mints the same JWT subject, persists login time and exposes only login fields", async () => {
    const result = await service.login({ email: actor.email, password: "Secret1!" });
    expect(Object.keys(result).sort()).toEqual(["accessToken", "email", "name", "surname"]);
    expect(jwt.verify(result.accessToken).sub).toBe(ID);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ lastLoginAt: expect.any(Date) }));
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: actor.email }, relations: { role: true } });
  });

  it.each([UserStatus.PENDING, UserStatus.REJECTED, UserStatus.DISABLED])("preserves login rejection for %s", async (status) => {
    actor.status = status; actor.rejectionReason = "Rejected reason";
    expect(await errorOf(service.login({ email: actor.email, password: "Secret1!" }))).toMatchSnapshot();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("preserves invalid credentials and duplicate application errors", async () => {
    expect(await errorOf(service.login({ email: actor.email, password: "wrong" }))).toEqual({ status: 401, body: { error: "Invalid email or password" } });
    expect(await errorOf(service.register({ name: actor.name, surname: actor.surname, email: actor.email, password: "Secret1!" }))).toEqual({ status: 409, body: { message: "Application already exists.", status: "active" } });
  });

  it("protects the last active owner and allows disabling when another owner remains", async () => {
    actor.role!.code = "owner";
    expect(await errorOf(service.disable(ID, "other-actor"))).toEqual({ status: 400, body: { statusCode: 400, error: "Bad Request", message: "The last active owner cannot be disabled" } });
    expect(repo.save).not.toHaveBeenCalled();
    repo.count.mockResolvedValueOnce(2);
    await expect(service.disable(ID, "other-actor")).resolves.toMatchObject({ status: "disabled" });
  });

  it("protects the final owner role and personal owner permissions", async () => {
    actor.role!.code = "owner";
    roles.findOne.mockResolvedValue({ id: "new-role", code: "waiter", isActive: true });
    expect(await errorOf(service.changeRole(ID, "new-role", "other-actor"))).toMatchSnapshot("owner-role");
    expect(await errorOf(service.updatePermissions(ID, [], [], "other-actor"))).toMatchSnapshot("owner-permissions");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("preserves self-management and conflicting-permission rejections", async () => {
    expect(await errorOf(service.disable(ID, ID))).toMatchSnapshot("self-disable");
    expect(await errorOf(service.changeRole(ID, "role", ID))).toMatchSnapshot("self-role");
    expect(await errorOf(service.updatePermissions(ID, [], [], ID))).toMatchSnapshot("self-permissions");
    expect(await errorOf(service.updatePermissions(ID, [Permission.ORDERS_VIEW], [Permission.ORDERS_VIEW], "other-actor"))).toMatchSnapshot("conflict");
    expect(repo.save).not.toHaveBeenCalled();
  });
});
