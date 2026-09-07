import { User } from "../entities/user.entity";
import { DiningTable } from "../entities/dining-table.entity";
import { Permission } from "../common/auth/permission";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { localizedNameResponse } from "../common/i18n/localized-response";

export function tableResponse(user: User, table: DiningTable, locale?: string) {
  const canManageQr = getEffectivePermissions(user)
    .includes(Permission.TABLES_QR_MANAGE);
  const localizedTable = localizedNameResponse(table, locale);

  return canManageQr
    ? localizedTable
    : { ...localizedTable, publicToken: undefined };
}
