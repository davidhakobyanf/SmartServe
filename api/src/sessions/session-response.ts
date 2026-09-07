import { User } from "../entities/user.entity";
import { DiningSession } from "../entities/dining-session.entity";
import { Permission } from "../common/auth/permission";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { localizedNameResponse } from "../common/i18n/localized-response";

export function adminSessionResponse(user: User, session: DiningSession, locale?: string) {
  const canManageQr = getEffectivePermissions(user)
    .includes(Permission.TABLES_QR_MANAGE);

  const localizedSession = session.table
    ? { ...session, table: localizedNameResponse(session.table, locale) }
    : session;

  if (canManageQr || !localizedSession.table) return localizedSession;
  return {
    ...localizedSession,
    table: { ...localizedSession.table, publicToken: undefined },
  };
}

export function guestSessionResponse(session: DiningSession, locale?: string) {
  return {
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    closedAt: session.closedAt,
    table: {
      id: session.table.id,
      number: session.table.number,
      name: localizedNameResponse(session.table, locale).name,
      nameTranslations: session.table.nameTranslations,
    },
  };
}
