import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { OrdersModule } from "./orders/orders.module";
import { WaiterModule } from "./waiter/waiter.module";
import { SessionsModule } from "./sessions/sessions.module";
import { SetupModule } from "./setup/setup.module";
import { RolesModule } from "./roles/roles.module";
import { TablesModule } from "./tables/tables.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { BasketItemsModule } from "./basket-items/basket-items.module";
import { VenueSettingsModule } from "./venue-settings/venue-settings.module";
import { ENTITIES } from "./database/entities";
import { SaucesModule } from "./sauces/sauces.module";

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
        entities: ENTITIES,
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        migrationsTableName: "typeorm_migrations",
        migrationsRun:
          config.get<string>("DB_MIGRATIONS_RUN", "true") === "true",
        synchronize: false,
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
    VenueSettingsModule,
    SaucesModule,
  ],
})
export class AppModule {}
