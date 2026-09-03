import "dotenv/config";
import { DataSource } from "typeorm";
import { ENTITIES } from "./entities";

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? "smartserve",
  password: process.env.DB_PASSWORD ?? "smartserve",
  database: process.env.DB_DATABASE ?? "smartserve",
  entities: ENTITIES,
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
});
