# Контракты, зафиксированные перед рефакторингом

Baseline: `dfda12e`; 8 suites / 27 tests, API build и frontend lint проходят.
Полный перечень HTTP methods, paths, guards, permissions и параметров находится
в snapshot `src/contracts/__snapshots__/routes.contract.spec.ts.snap`.
Snapshot получен на исходной реализации; после рефакторинга его не обновлять.

| Граница | Доступ / вход | Ответ / ошибки | Эффекты | Frontend |
| --- | --- | --- | --- | --- |
| POST /api/register | Public; RegisterDto | message; 400 password/validation, 409 application + status | Pending user, bcrypt hash | Registration |
| POST /api/user/login, /api/auth/login | Public; email/password | accessToken, name, surname, email; 401 error, 403 message/status/reason | JWT sub=user.id, lastLoginAt | Login |
| GET /api/auth/me | Bearer JWT; active user + active role | identity, permissions, localized role; 401/403 error | None | ProfileDataContext |
| /api/profile, /password, /avatar | Bearer JWT; profile/password/image DTO | profile (including card: []), success/avatarName/updatedAt; feature-specific errors | User fields, hash, avatar bytes | Account |
| /api/users + approve/reject/enable/disable/role/permissions | JWT + per-route staff permission | Action-specific user projections; 400 owner/self/status rules; 404 | Staff status, role and overrides | staffApi |
| /api/roles + enable/disable | JWT + roles.manage | Localized role; 400/404/409 | Role fields and permissions | staffApi |
| /api/categories, /api/sauces, /api/products | JWT + per-route menu permissions; DTO + Accept-Language | Entity/localized product projection; 400/404/409; delete {success:true} | Menu records, image bytes, product-sauce links | DataApi, MenuManagement |
| GET /api/menu | x-session-token UUID, open session; Accept-Language | Product projection, only active menu/active sauces; 401/403/404 | None | ClientDashboard |
| GET /api/{product,category,sauce,profile}-images/:id | Public UUID | Binary; Content-Type, public max-age=86400; 400/404 | None | image URL helpers |
| /api/tables | JWT + tables.view/manage; DTO, Accept-Language | Localized table + activeSession; publicToken omitted without tables.qr.manage | Table state | tablesApi |
| POST /api/sessions/open | Public; tableToken UUID | Guest session (no publicToken); 400/404/503 | Reuse or create open session | QR route, DataApi |
| GET /api/sessions/current | x-session-token UUID | Guest session; 401 missing/invalid, 404 missing, 403 closed | None | DataApi |
| GET /api/sessions/open; PATCH /:id/close | JWT + tables.view/manage | Admin session, QR visibility by permission | Close event after save | tablesApi |
| /api/basket-items | Open session; productId, quantity, sauceIds | Basket entity/array; delete {success:true}; 400/404 | Merge by product + sauce IDs; price snapshots; basket event | DataApi, ClientDashboard |
| GET /api/orders; PATCH /:id/status | JWT + orders.view/manage | Order projection; total/unitPrice/lineTotal null without revenue.view; 400/404 | Status, completedAt, orders event | OrdersContext, Orders |
| GET /api/orders/mine; POST /api/orders | Open session | Order projection including financials; 400 empty/closed | Locked transaction: snapshots, order save, basket delete; then events | DataApi |
| /api/venue-settings; /public | Admin JWT + venue.settings.manage; public GET | Full settings / venueName+currency | Singleton settings | VenueSettingsContext |
| POST /api/setup | Public; SetupDto | Owner user/role summary; 400/409 | Transaction: initial owner role + user | Initial setup |
| GET /api/health | Public | {status:"ok"} | None | Deployment |
| orders / join | handshake.accessToken | {ok:true} or exact error; inactive differs from waiter | Leave orders/revenue, join permission-specific room | OrdersContext |
| orders / orders:updated | domain orders:changed | Two projections with distinct financial visibility | Broadcast to orders/revenue | OrdersContext |
| sessions / join | payload {token}, open session | {ok:true} / invalid or closed error | Join session:<token> | useSessionLock |
| sessions / closed, basket:updated | domain session:closed / session:basket-changed | {sessionId,tableNumber} / items array | Broadcast session room | useSessionLock |
| waiter / join | handshake.accessToken + waiter_calls.view | {ok:true} / error | Join admin | WaiterCallsContext |
| waiter / waiter:call → waiter:called | handshake.sessionToken, open session | {ok:true,call:{id,table:string,calledAt}} / error | Broadcast admin | useWaiterClient |

DTO validation remains whitelist + transform + implicit conversion. Optional,
null and omitted fields are intentionally distinguished. Existing ordering,
error wording, lookup case sensitivity and permission precedence are contractual.
