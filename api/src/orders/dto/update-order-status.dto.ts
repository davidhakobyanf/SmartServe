import { IsIn } from "class-validator";
import type { OrderStatus } from "src/entities/order.entity";

export class UpdateOrderStatusDto {
  @IsIn(["placed", "completed", "cancelled"])
  status!: OrderStatus;
}
