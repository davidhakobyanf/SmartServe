import { UserStatus } from "../common/auth/user-status";
import { Permission } from "../common/auth/permission";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { DiningTable } from "../entities/dining-table.entity";
import { DiningSession } from "../entities/dining-session.entity";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Product } from "../entities/product.entity";
import { Category } from "../entities/category.entity";
import { Sauce } from "../entities/sauce.entity";
import { ProductSauce } from "../entities/product-sauce.entity";

export const ID = "11111111-1111-4111-8111-111111111111";
export const SESSION_ID = "22222222-2222-4222-8222-222222222222";
export const NOW = new Date("2026-09-07T10:00:00.000Z");

export function userFixture(permissions: Permission[] = []): User {
  return Object.assign(new User(), {
    id: ID, name: "Davit", surname: "Test", email: "test@example.com",
    password: "never-expose", status: UserStatus.ACTIVE, roleId: ID,
    permissionAllow: [], permissionDeny: [], avatarName: null,
    createdAt: NOW, updatedAt: NOW, lastLoginAt: null,
    approvedAt: NOW, approvedByUserId: ID, rejectionReason: null,
    role: Object.assign(new Role(), {
      id: ID, code: "manager", name: "Manager",
      nameTranslations: { en: "Manager", ru: "Менеджер", am: "Կառավարիչ" },
      permissions, isActive: true, isSystem: false, createdAt: NOW, updatedAt: NOW,
    }),
  });
}

export function tableFixture(): DiningTable {
  return Object.assign(new DiningTable(), {
    id: ID, number: 7, name: "Window", nameTranslations: { en: "Window", ru: "У окна" },
    publicToken: ID, isActive: true, createdAt: NOW, updatedAt: NOW,
  });
}

export function sessionFixture(): DiningSession {
  return Object.assign(new DiningSession(), {
    id: SESSION_ID, tableId: ID, table: tableFixture(),
    status: "open", createdAt: NOW, closedAt: null,
  });
}

export function productFixture(): Product {
  return Object.assign(new Product(), {
    id: ID, categoryId: ID, title: "Burger", titleTranslations: { en: "Burger", ru: "Бургер" },
    description: "Beef", descriptionTranslations: { en: "Beef", ru: "Говядина" },
    price: 1000, stockQuantity: 12, isActive: true, imageName: "burger.png", imageMimeType: "image/png",
    createdAt: NOW, updatedAt: NOW,
    category: Object.assign(new Category(), {
      id: ID, name: "Food", nameTranslations: { en: "Food", ru: "Еда" }, isActive: true,
    }),
    sauceLinks: [true, false].map((isActive, index) => Object.assign(new ProductSauce(), {
      sauce: Object.assign(new Sauce(), {
        id: `sauce-${index}`, name: index ? "BBQ" : "Garlic",
        nameTranslations: index ? { ru: "Барбекю" } : { ru: "Чесночный" },
        price: 300, isActive,
      }),
    })),
  });
}

export function orderFixture(): Order {
  return Object.assign(new Order(), {
    id: ID, tableId: ID, table: tableFixture(), sessionId: SESSION_ID,
    status: "placed", total: 2600, completedAt: null, createdAt: NOW, updatedAt: NOW,
    items: [Object.assign(new OrderItem(), {
      id: ID, productId: ID, titleSnapshot: "Original burger", descriptionSnapshot: "Original beef",
      titleTranslationsSnapshot: { en: "Original burger", am: "Բուրգեր", ru: "Бургер" },
      descriptionTranslationsSnapshot: { en: "Original beef", am: "Տավարի միս", ru: "Говядина" },
      product: productFixture(), unitPrice: 1000, quantity: 2, lineTotal: 2600, createdAt: NOW,
      sauces: [{ id: ID, name: "Garlic", unitPrice: 300 }],
    })],
  });
}
