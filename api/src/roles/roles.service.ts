import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { Repository } from "typeorm";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import {
  cleanLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.rolesRepo.findOne({
      where: { code: dto.code },
    });

    if (existingRole) {
      throw new ConflictException("A role with this code already exists.");
    }
    const nameTranslations = withLegacyEnglish(
      dto.nameTranslations,
      dto.name,
    );
    const name = primaryLocalizedText(nameTranslations);

    if (!name) {
      throw new BadRequestException("Role name cannot be empty");
    }

    const role = this.rolesRepo.create({
      name,
      nameTranslations,
      code: dto.code,
      permissions: [...dto.permissions],
      isSystem: false,
      isActive: true,
    });

    return this.rolesRepo.save(role);
  }
  async update(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be modified");
    }
    if (
      dto.name === undefined &&
      dto.nameTranslations === undefined &&
      dto.permissions === undefined
    ) {
      throw new BadRequestException("At least one field must be provided");
    }
    if (dto.name !== undefined || dto.nameTranslations !== undefined) {
      const nameTranslations =
        dto.nameTranslations !== undefined
          ? cleanLocalizedText(dto.nameTranslations)
          : withLegacyEnglish(role.nameTranslations, dto.name);
      if (dto.name !== undefined && dto.nameTranslations === undefined) {
        nameTranslations.en = dto.name.trim();
      }
      const name = primaryLocalizedText(nameTranslations);

      if (!name) {
        throw new BadRequestException("Role name cannot be empty");
      }

      role.name = name;
      role.nameTranslations = nameTranslations;
    }
    if (dto.permissions !== undefined) {
      role.permissions = [...dto.permissions];
    }
    return this.rolesRepo.save(role);
  }
  async enable(roleId: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be modified");
    }
    if (role.isActive) {
      throw new BadRequestException("Only inactive roles can be enabled");
    }
    role.isActive = true;
    return this.rolesRepo.save(role);
  }
  async disable(roleId: string, actorRoleId: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({
      where: { id: roleId },
    });
    if (roleId === actorRoleId) {
      throw new BadRequestException("You cannot disable your own role");
    }
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be disabled");
    }
    if (!role.isActive) {
      throw new BadRequestException("Only active roles can be disabled");
    }
    role.isActive = false;

    return this.rolesRepo.save(role);
  }
  async findAll(): Promise<Role[]> {
    return this.rolesRepo.find({
      order: {
        isSystem: "DESC",
        name: "ASC",
      },
    });
  }
}
