import { Role } from "../entities/role.entity";
import { resolveLocalizedText } from "../common/i18n/localized-text";

export function roleSummary(role: Role, locale?: string) {
  return {
    id: role.id,
    name: resolveLocalizedText(role.nameTranslations, role.name, locale),
    code: role.code,
  };
}

export function roleResponse(role: Role, locale?: string) {
  return {
    id: role.id,
    name: resolveLocalizedText(
      role.nameTranslations,
      role.name,
      locale,
    ),
    nameTranslations: role.nameTranslations,
    code: role.code,
    permissions: role.permissions,
    isSystem: role.isSystem,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
