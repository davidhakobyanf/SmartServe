import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { SessionProfile } from "./entities/session-profile.entity";
import { BasketStore } from "./entities/basket-store.entity";
import { OrderStore } from "./entities/order-store.entity";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { MenuModule } from "./menu/menu.module";
import { BasketModule } from "./basket/basket.module";
import { OrdersModule } from "./orders/orders.module";
import { WaiterModule } from "./waiter/waiter.module";
import { DiningSession } from "./entities/dining-session.entity";
import { SessionsModule } from "./sessions/sessions.module";
import { SetupModule } from "./setup/setup.module";
import { Role } from "./entities/role.entity";
import { RolesModule } from "./roles/roles.module";

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
          SessionProfile,
          BasketStore,
          OrderStore,
          DiningSession,
        ],
        synchronize: config.get<string>("DB_SYNC", "false") === "true",
      }),
    }),
    UsersModule,
    AuthModule,
    ProfileModule,
    MenuModule,
    SessionsModule,
    BasketModule,
    OrdersModule,
    WaiterModule,
    SetupModule,
    RolesModule,
  ],
})
export class AppModule {}
