import { validate } from "class-validator";
import { UpdateOrderStatusDto } from "./update-order-status.dto";
import { ORDER_STATUSES } from "src/entities/order.entity";

describe("Order status validation", () => {
  it.each(ORDER_STATUSES)("accepts %s", async (status) => {
    expect(await validate(Object.assign(new UpdateOrderStatusDto(), { status }))).toHaveLength(0);
  });

  it("rejects unknown statuses", async () => {
    expect(await validate(Object.assign(new UpdateOrderStatusDto(), { status: "cooking-typo" }))).not.toHaveLength(0);
  });
});
