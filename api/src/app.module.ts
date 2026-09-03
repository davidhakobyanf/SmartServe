import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { OrdersModule } from "./orders/orders.module";
import { WaiterModule } from "./waiter/waiter.module";
import { DiningSession } from "./entities/dining-session.entity";
import { SessionsModule } from "./sessions/sessions.module";
import { SetupModule } from "./setup/setup.module";
import { Role } from "./entities/role.entity";
import { RolesModule } from "./roles/roles.module";
import { DiningTable } from "./entities/dining-table.entity";
import { TablesModule } from "./tables/tables.module";
import { Category } from "./entities/category.entity";
import { Product } from "./entities/product.entity";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { BasketItem } from "./entities/basket-item.entity";
import { BasketItemsModule } from "./basket-items/basket-items.module";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get<string>("DB_USERNAME", "smartserve"),
        password: config.get<string>("DB_PASSWORD", "smartserve"),
        database: config.get<string>("DB_DATABASE", "smartserve"),
        entities: [
          User,
          Role,
          DiningSession,
          DiningTable,
          Category,
          Product,
          BasketItem,
          Order,
          OrderItem,
        ],
        synchronize: config.get<string>("DB_SYNC", "false") === "true",
      }),
    }),
    UsersModule,
    AuthModule,
    ProfileModule,
    SessionsModule,
    OrdersModule,
    WaiterModule,
    SetupModule,
    RolesModule,
    TablesModule,
    CategoriesModule,
    ProductsModule,
    BasketItemsModule,
  ],
})
export class AppModule {}
