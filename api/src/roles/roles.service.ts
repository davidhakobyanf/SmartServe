import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { Repository } from "typeorm";
import { CreateRoleDto } from "./dto/create-role.dto";

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
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException("Role name cannot be empty");
    }

    const role = this.rolesRepo.create({
      name,
      code: dto.code,
      permissions: [...dto.permissions],
      isSystem: false,
      isActive: true,
    });

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
