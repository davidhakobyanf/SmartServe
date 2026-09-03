import { BasketItem } from "src/entities/basket-item.entity";
import { Category } from "src/entities/category.entity";
import { DiningSession } from "src/entities/dining-session.entity";
import { DiningTable } from "src/entities/dining-table.entity";
import { OrderItem } from "src/entities/order-item.entity";
import { Order } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";
import { Role } from "src/entities/role.entity";
import { User } from "src/entities/user.entity";
import { VenueSettings } from "src/entities/venue-settings.entity";

export const ENTITIES = [
  User,
  Role,
  DiningSession,
  DiningTable,
  Category,
  Product,
  BasketItem,
  Order,
  OrderItem,
  VenueSettings,
];
