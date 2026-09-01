import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DiningTable } from "src/entities/dining-table.entity";
import { Repository } from "typeorm";
import { CreateTableDto } from "./dto/create-table.dto";
import { randomUUID } from "crypto";
import { DiningSession } from "src/entities/dining-session.entity";
import { UpdateTableDto } from "./dto/update-table.dto";

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(DiningTable)
    private readonly tablesRepo: Repository<DiningTable>,
    @InjectRepository(DiningSession)
    private readonly sessionsRepo: Repository<DiningSession>,
  ) {}

  async create(dto: CreateTableDto): Promise<DiningTable> {
    const existingTable = await this.tablesRepo.findOne({
      where: {
        number: dto.number,
      },
    });

    if (existingTable) {
      throw new ConflictException(
        `Table with number ${dto.number} already exists.`,
      );
    }
    const table = this.tablesRepo.create({
      number: dto.number,
      name: dto.name?.trim() || null,
      publicToken: randomUUID(),
      isActive: dto.isActive ?? true,
    });
    return this.tablesRepo.save(table);
  }
  async update(tableId: string, dto: UpdateTableDto): Promise<DiningTable> {
    const table = await this.tablesRepo.findOne({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException("Table not found");
    }
    if (dto.number !== undefined && dto.number !== table.number) {
      const tableWithSameNumber = await this.tablesRepo.findOne({
        where: {
          number: dto.number,
        },
      });
      if (tableWithSameNumber) {
        throw new ConflictException(
          `Table with number ${dto.number} already exists.`,
        );
      }

      table.number = dto.number;
    }
    if (dto.name !== undefined) {
      table.name = dto.name?.trim() || null;
    }
    if (dto.isActive !== undefined) {
      if (dto.isActive === false) {
        const openSession = await this.sessionsRepo.findOne({
          where: {
            tableId: table.id,
            status: "open",
          },
        });
        if (openSession) {
          throw new ConflictException(
            "An occupied table cannot be deactivated",
          );
        }
      }
      table.isActive = dto.isActive;
    }
    return this.tablesRepo.save(table);
  }
  async findAll() {
    const [tables, openSessions] = await Promise.all([
      this.tablesRepo.find({
        order: {
          number: "ASC",
        },
      }),
      this.sessionsRepo.find({
        where: {
          status: "open",
        },
      }),
    ]);

    const sessionByTableId = new Map(
      openSessions.map((session) => [session.tableId, session]),
    );
    return tables.map((table) => {
      const session = sessionByTableId.get(table.id);
      return {
        ...table,
        activeSession: session
          ? {
              id: session.id,
              status: session.status,
              createdAt: session.createdAt,
              closedAt: session.closedAt,
              table: {
                id: table.id,
                number: table.number,
                name: table.name,
              },
            }
          : null,
      };
    });
  }
}
