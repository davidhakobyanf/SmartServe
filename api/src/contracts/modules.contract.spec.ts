import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module";
import { UsersService } from "../users/users.service";
import { ProductsService } from "../products/products.service";
import { OrdersGateway } from "../orders/orders.gateway";
import { WaiterGateway } from "../waiter/waiter.gateway";
import { SessionsGateway } from "../sessions/session.gateway";
import { StaffSocketAuthService } from "../users/staff-socket-auth.service";
import { MenuGateway } from "../products/menu.gateway";
import { TablesGateway } from "../tables/tables.gateway";

describe("Application dependency graph", () => {
  it("resolves all feature providers with the actual module wiring and no database connection", async () => {
    const database = {
      entityMetadatas: [], options: { type: "postgres" },
      getRepository: jest.fn(() => ({})), manager: {}, isInitialized: false,
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource).useValue(database)
      .compile();
    try {
      for (const provider of [UsersService, ProductsService, MenuGateway, OrdersGateway, WaiterGateway, SessionsGateway, TablesGateway, StaffSocketAuthService]) {
        expect(module.get(provider, { strict: false })).toBeInstanceOf(provider);
      }
      expect(database.getRepository).toHaveBeenCalled();
    } finally {
      await module.close();
    }
  });
});
