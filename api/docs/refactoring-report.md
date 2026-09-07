# Отчёт о рефакторинге backend

Рефакторинг выполнен локально поверх `dfda12e`. Коммитов и push нет.
Изменены только файлы внутри `api/`; изменения не staged.

## Результат

- `UsersService` стал фасадом над authentication, staff management и user queries.
- Product queries, связи с соусами и media operations выделены в отдельные компоненты.
- Controllers используют функции ответа для профиля, пользователей, ролей, столов и сессий.
- Общая WebSocket-проверка сотрудников вынесена в `StaffSocketAuthService`.
- Вычисление permissions, стоимости заказа и выбор соусов доступны как обычные функции.
- Повторяющаяся обработка переводов, изображений и foreign-key ошибок вынесена в helpers.
- TypeORM entities, DTO, HTTP guards, миграции, зависимости, main.ts и runtime configuration сохранены.
- HTTP routes/JSON, Socket.IO события/комнаты/acknowledgements, права, ошибки и порядок событий
  проверены относительно исходных контрактов.

## Проверки

| Команда / проверка | Результат |
| --- | --- |
| Исходный `cd api && npm test` | 8 suites / 27 tests |
| Итоговый `cd api && npm test` | 19 suites / 90 tests / 50 snapshots — PASS |
| `cd api && npm run build` | PASS |
| `cd app && npm run lint` | PASS |
| `cd app && npm run build` | PASS, 33 страницы сгенерированы |
| `git diff --check` | PASS |
| Diff frontend, entities, migrations, DTO, guards, dependencies, runtime config | Нет изменений |
| Nest AppModule dependency graph | Собирается с фиктивным DataSource |
| Реальный PostgreSQL / полный браузерный E2E | Не запускались |

HTTP contract tests используют настоящие Nest routing/guards/pipes и временный локальный
HTTP-сервер, а persistence заменяют mocks. WebSocket contract tests вызывают настоящие
обработчики gateway через фиктивные sockets. Транзакционные тесты проверяют порядок
вызовов и отсутствие событий при ошибке сохранения/commit; они не проверяют PostgreSQL locks
под реальной конкурентной нагрузкой.

50 snapshots получены до изменения production-кода. После рефакторинга они не обновлялись.
В исходном `products.service.spec.ts` изменена только сборка зависимостей; исходные assertions
сохранены. Test fixtures исключены из production compilation.

Команды завершились с exit code 0. Во время тестов Node выдаёт предупреждение `DEP0169`;
frontend build также выдаёт предупреждения webpack о кешировании динамического импорта
в next-intl. Ошибок сборки и тестов нет.

## Ограничения и отдельные задачи

Существующее неатомарное обновление продукта/соусов, возможные гонки изменения последнего
владельца, ценовые snapshots соусов в ответах без revenue.view и различие fallback CORS origins
описаны в [учебном разборе](backend-refactoring-ru.md#что-сохранено-и-что-оставлено-отдельной-задачей).
Их поведение не менялось. Объединение runtime/CLI TypeORM configuration оставлено вне изменений.

## Порядок совместного разбора

[Пошаговый маршрут на русском](backend-refactoring-ru.md): вход → модули и зависимости →
сотрудники и permissions → JSON-ответы → продукты → общие функции → транзакция заказа →
WebSocket → тесты.

[Матрица HTTP/WebSocket-контрактов](contracts.md) содержит входы, доступ, ответы,
ошибки, эффекты и frontend consumers.

## Изменённые файлы (27)

- [README.md](../README.md)
- [src/auth/auth.controller.ts](../src/auth/auth.controller.ts)
- [src/basket-items/basket-items.service.ts](../src/basket-items/basket-items.service.ts)
- [src/categories/categories.controller.ts](../src/categories/categories.controller.ts)
- [src/categories/categories.service.ts](../src/categories/categories.service.ts)
- [src/common/i18n/localized-text.ts](../src/common/i18n/localized-text.ts)
- [src/common/utils/image-upload.util.ts](../src/common/utils/image-upload.util.ts)
- [src/orders/orders.controller.ts](../src/orders/orders.controller.ts)
- [src/orders/orders.gateway.ts](../src/orders/orders.gateway.ts)
- [src/orders/orders.service.ts](../src/orders/orders.service.ts)
- [src/products/product-images.controller.ts](../src/products/product-images.controller.ts)
- [src/products/products.module.ts](../src/products/products.module.ts)
- [src/products/products.service.spec.ts](../src/products/products.service.spec.ts)
- [src/products/products.service.ts](../src/products/products.service.ts)
- [src/profile/profile.controller.ts](../src/profile/profile.controller.ts)
- [src/profile/profile.service.ts](../src/profile/profile.service.ts)
- [src/roles/roles.controller.ts](../src/roles/roles.controller.ts)
- [src/roles/roles.service.ts](../src/roles/roles.service.ts)
- [src/sauces/sauces.controller.ts](../src/sauces/sauces.controller.ts)
- [src/sauces/sauces.service.ts](../src/sauces/sauces.service.ts)
- [src/sessions/sessions.controller.ts](../src/sessions/sessions.controller.ts)
- [src/tables/tables.controller.ts](../src/tables/tables.controller.ts)
- [src/users/users-management.controller.ts](../src/users/users-management.controller.ts)
- [src/users/users.module.ts](../src/users/users.module.ts)
- [src/users/users.service.ts](../src/users/users.service.ts)
- [src/waiter/waiter.gateway.ts](../src/waiter/waiter.gateway.ts)
- [tsconfig.build.json](../tsconfig.build.json)

## Новые файлы (37)

- [docs/backend-refactoring-ru.md](../docs/backend-refactoring-ru.md)
- [docs/contracts.md](../docs/contracts.md)
- [docs/refactoring-report.md](../docs/refactoring-report.md)
- [src/auth/auth-response.ts](../src/auth/auth-response.ts)
- [src/common/auth/effective-permissions.ts](../src/common/auth/effective-permissions.ts)
- [src/common/http/image-response.ts](../src/common/http/image-response.ts)
- [src/common/i18n/localized-text.spec.ts](../src/common/i18n/localized-text.spec.ts)
- [src/common/utils/image-upload.util.spec.ts](../src/common/utils/image-upload.util.spec.ts)
- [src/contracts/__snapshots__/http.contract.spec.ts.snap](../src/contracts/__snapshots__/http.contract.spec.ts.snap)
- [src/contracts/__snapshots__/routes.contract.spec.ts.snap](../src/contracts/__snapshots__/routes.contract.spec.ts.snap)
- [src/contracts/__snapshots__/users.contract.spec.ts.snap](../src/contracts/__snapshots__/users.contract.spec.ts.snap)
- [src/contracts/__snapshots__/websocket.contract.spec.ts.snap](../src/contracts/__snapshots__/websocket.contract.spec.ts.snap)
- [src/contracts/events.contract.spec.ts](../src/contracts/events.contract.spec.ts)
- [src/contracts/fixtures.ts](../src/contracts/fixtures.ts)
- [src/contracts/http.contract.spec.ts](../src/contracts/http.contract.spec.ts)
- [src/contracts/modules.contract.spec.ts](../src/contracts/modules.contract.spec.ts)
- [src/contracts/routes.contract.spec.ts](../src/contracts/routes.contract.spec.ts)
- [src/contracts/users.contract.spec.ts](../src/contracts/users.contract.spec.ts)
- [src/contracts/websocket.contract.spec.ts](../src/contracts/websocket.contract.spec.ts)
- [src/database/database-error.ts](../src/database/database-error.ts)
- [src/orders/order-calculation.spec.ts](../src/orders/order-calculation.spec.ts)
- [src/orders/order-calculation.ts](../src/orders/order-calculation.ts)
- [src/products/product-images.service.ts](../src/products/product-images.service.ts)
- [src/products/product-sauces.service.ts](../src/products/product-sauces.service.ts)
- [src/products/product-workflows.spec.ts](../src/products/product-workflows.spec.ts)
- [src/products/products.repository.ts](../src/products/products.repository.ts)
- [src/profile/profile-response.ts](../src/profile/profile-response.ts)
- [src/roles/role-response.ts](../src/roles/role-response.ts)
- [src/sauces/sauce-selection.spec.ts](../src/sauces/sauce-selection.spec.ts)
- [src/sauces/sauce-selection.ts](../src/sauces/sauce-selection.ts)
- [src/sessions/session-response.ts](../src/sessions/session-response.ts)
- [src/tables/table-response.ts](../src/tables/table-response.ts)
- [src/users/staff-management.service.ts](../src/users/staff-management.service.ts)
- [src/users/staff-socket-auth.service.ts](../src/users/staff-socket-auth.service.ts)
- [src/users/user-authentication.service.ts](../src/users/user-authentication.service.ts)
- [src/users/user-response.ts](../src/users/user-response.ts)
- [src/users/users.repository.ts](../src/users/users.repository.ts)
