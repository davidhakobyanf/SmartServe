import { INestApplication, ValidationPipe, ForbiddenException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthController } from "../auth/auth.controller";
import { UsersController } from "../users/users.controller";
import { UsersManagementController } from "../users/users-management.controller";
import { UsersService } from "../users/users.service";
import { OrdersController } from "../orders/orders.controller";
import { OrdersService } from "../orders/orders.service";
import { SessionsController } from "../sessions/sessions.controller";
import { SessionsService } from "../sessions/sessions.service";
import { TablesController } from "../tables/tables.controller";
import { TablesService } from "../tables/tables.service";
import { ProductsController } from "../products/products.controller";
import { PublicMenuController } from "../products/public-menu.controller";
import { ProductImagesController } from "../products/product-images.controller";
import { ProductsService } from "../products/products.service";
import { CategoryImagesController } from "../categories/categories.controller";
import { CategoriesService } from "../categories/categories.service";
import { SauceImagesController } from "../sauces/sauces.controller";
import { SaucesService } from "../sauces/sauces.service";
import { ProfileController, ProfileImagesController } from "../profile/profile.controller";
import { ProfileService } from "../profile/profile.service";
import { RolesController } from "../roles/roles.controller";
import { RolesService } from "../roles/roles.service";
import { Permission } from "../common/auth/permission";
import { UserStatus } from "../common/auth/user-status";
import { ID, SESSION_ID, orderFixture, productFixture, sessionFixture, tableFixture, userFixture } from "./fixtures";

describe("HTTP compatibility (real Nest routing, guards, pipes and serialization)", () => {
  let app: INestApplication;
  let baseUrl: string;
  let actor = userFixture();
  const jwt = new JwtService({ secret: "contract-test-only" });
  const users = {
    findById: jest.fn(async () => actor),
    getEffectivePermissions: UsersService.prototype.getEffectivePermissions,
    login: jest.fn(async () => ({ accessToken: "token", name: "Davit", surname: "Test", email: "test@example.com" })),
    register: jest.fn(async () => ({ message: "Application submitted.Await approval." })),
    findAll: jest.fn(async () => [actor]),
    approve: jest.fn(async () => actor), reject: jest.fn(async () => actor),
    disable: jest.fn(async () => actor), enable: jest.fn(async () => actor),
    changeRole: jest.fn(async () => actor), updatePermissions: jest.fn(async () => actor),
  };
  const orders = {
    findAll: jest.fn(async () => [orderFixture()]),
    findForSession: jest.fn(async () => [orderFixture()]),
    createFromBasket: jest.fn(async () => orderFixture()),
    updateStatus: jest.fn(async () => orderFixture()),
  };
  const sessions = {
    assertOpen: jest.fn(async () => sessionFixture()),
    openForTable: jest.fn(async () => sessionFixture()),
    listOpen: jest.fn(async () => [sessionFixture()]),
    close: jest.fn(async () => sessionFixture()),
  };
  const image = { buffer: Buffer.from("image-bytes"), mimeType: "image/png" };
  const imageService = { getImage: jest.fn(async () => image) };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController, UsersController, UsersManagementController, OrdersController,
        SessionsController, TablesController, ProductsController, PublicMenuController,
        ProductImagesController, CategoryImagesController, SauceImagesController,
        ProfileController, ProfileImagesController, RolesController],
      providers: [
        { provide: JwtService, useValue: jwt }, { provide: UsersService, useValue: users },
        { provide: OrdersService, useValue: orders }, { provide: SessionsService, useValue: sessions },
        { provide: TablesService, useValue: { findAll: async () => [tableFixture()] } },
        { provide: ProductsService, useValue: { ...imageService, findAll: async () => [productFixture()], findActiveMenu: async () => [productFixture()] } },
        { provide: CategoriesService, useValue: imageService }, { provide: SaucesService, useValue: imageService },
        {
          provide: ProfileService, useValue: {
            getProfile: (user: typeof actor, locale?: string) => new ProfileService(users as never).getProfile(user, locale),
            getAvatar: async () => image,
          }
        },
        { provide: RolesService, useValue: { findAll: async () => [actor.role] } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => { await app?.close(); });
  beforeEach(() => { actor = userFixture(); jest.clearAllMocks(); });

  async function request(path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) {
    const response = await fetch(`${baseUrl}/api/${path}`, {
      method, headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() as unknown };
  }
  const staffHeaders = () => ({ Authorization: `Bearer ${jwt.sign({ sub: ID })}`, "Accept-Language": "ru-RU, en;q=0.9" });
  const guestHeaders = () => ({ "x-session-token": ` ${SESSION_ID} `, "Accept-Language": "ru" });

  it.each(["user/login", "auth/login"])("preserves login alias %s", async (path) => {
    expect(await request(path, "POST", { email: "test@example.com", password: "secret", ignored: true })).toEqual({
      status: 201, body: { accessToken: "token", name: "Davit", surname: "Test", email: "test@example.com" },
    });
    expect(users.login).toHaveBeenCalledWith({ email: "test@example.com", password: "secret" });
  });

  it("preserves validation errors and registration response", async () => {
    expect(await request("auth/login", "POST", { email: "bad" })).toMatchSnapshot("validation");
    expect(await request("register", "POST", { name: "Davit", surname: "Test", email: "test@example.com", password: "Secret1!" })).toEqual({
      status: 201, body: { message: "Application submitted.Await approval." },
    });
  });

  it("preserves localized auth, profile, staff and role responses without password", async () => {
    actor = userFixture([Permission.USERS_VIEW, Permission.ROLES_MANAGE]);
    for (const path of ["auth/me", "profile", "users", "roles"]) {
      const result = await request(path, "GET", undefined, staffHeaders());
      expect(result.status).toBe(200);
      expect(JSON.stringify(result)).not.toContain("never-expose");
      expect(result).toMatchSnapshot(path);
    }
  });

  it("preserves staff mutation response shapes", async () => {
    actor = userFixture([Permission.USERS_APPROVE, Permission.USERS_MANAGE]);
    for (const [action, payload] of [
      ["approve", { roleId: ID }], ["reject", { reason: "Reason" }],
      ["disable", {}], ["enable", {}], ["role", { roleId: ID }],
      ["permissions", { permissionAllow: [], permissionDeny: [] }],
    ] as const) {
      expect(await request(`users/${ID}/${action}`, "PATCH", payload, staffHeaders())).toMatchSnapshot(action);
    }
  });

  it("preserves JWT and permission error bodies", async () => {
    for (const authorization of [undefined, "Basic abc", "Bearer expired"]) {
      expect(await request("orders", "GET", undefined, authorization ? { Authorization: authorization } : {})).toMatchSnapshot(String(authorization));
    }
    expect(await request("orders", "GET", undefined, staffHeaders())).toEqual({ status: 403, body: { error: "Insufficient permissions", missing: ["orders.view"] } });
    actor.status = UserStatus.DISABLED;
    expect(await request("auth/me", "GET", undefined, staffHeaders())).toEqual({ status: 403, body: { error: "User is not active" } });
    actor.status = UserStatus.ACTIVE;
    actor.role!.isActive = false;
    expect(await request("auth/me", "GET", undefined, staffHeaders())).toEqual({ status: 403, body: { error: "Active role is not assigned" } });
  });

  it("preserves financial visibility and original order snapshots", async () => {
    for (const revenue of [false, true]) {
      actor = userFixture([Permission.ORDERS_VIEW, ...(revenue ? [Permission.REVENUE_VIEW] : [])]);
      expect(await request("orders", "GET", undefined, staffHeaders())).toMatchSnapshot(`revenue=${revenue}`);
    }
    expect(await request("orders/mine", "GET", undefined, guestHeaders())).toMatchSnapshot("mine");
    expect(await request("orders", "POST", {}, guestHeaders())).toMatchSnapshot("place");
    expect(orders.createFromBasket).toHaveBeenCalledWith(SESSION_ID);
  });

  it("preserves session header, closed-session errors and QR visibility", async () => {
    expect(await request("sessions/current")).toEqual({ status: 401, body: { error: "Missing or invalid session token" } });
    expect(await request("sessions/current", "GET", undefined, guestHeaders())).toMatchSnapshot("guest");
    expect(sessions.assertOpen).toHaveBeenCalledWith(SESSION_ID);
    expect(await request("sessions/open", "POST", { tableToken: ID })).toMatchSnapshot("open");
    sessions.assertOpen.mockRejectedValueOnce(new ForbiddenException("Session is closed or invalid"));
    expect(await request("sessions/current", "GET", undefined, guestHeaders())).toMatchSnapshot("closed");
    for (const qr of [false, true]) {
      actor = userFixture([Permission.TABLES_VIEW, ...(qr ? [Permission.TABLES_QR_MANAGE] : [])]);
      expect(await request("tables", "GET", undefined, staffHeaders())).toMatchSnapshot(`tables-qr=${qr}`);
      expect(await request("sessions/open", "GET", undefined, staffHeaders())).toMatchSnapshot(`sessions-qr=${qr}`);
    }
  });

  it("preserves localized product mapping and public-menu filtering", async () => {
    actor = userFixture([Permission.MENU_VIEW]);
    expect(await request("products", "GET", undefined, staffHeaders())).toMatchSnapshot("admin");
    expect(await request("menu", "GET", undefined, guestHeaders())).toMatchSnapshot("guest");
    expect(await request("menu")).toEqual({ status: 401, body: { error: "Missing or invalid session token" } });
  });

  it.each(["product-images", "category-images", "sauce-images", "profile-images"])("preserves public binary response at %s", async (path) => {
    const response = await fetch(`${baseUrl}/api/${path}/${ID}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(image.buffer);
    expect((await request(`${path}/invalid`)).status).toBe(400);
  });
});
