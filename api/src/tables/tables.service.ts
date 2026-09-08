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
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TABLE_DOMAIN_EVENTS } from "./table.events";
import {
  cleanLocalizedText,
  primaryLocalizedText,
  withLegacyEnglish,
} from "src/common/i18n/localized-text";

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(DiningTable)
    private readonly tablesRepo: Repository<DiningTable>,
    @InjectRepository(DiningSession)
    private readonly sessionsRepo: Repository<DiningSession>,
    private readonly events: EventEmitter2,
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
    const nameTranslations = withLegacyEnglish(
      dto.nameTranslations,
      dto.name,
    );
    const table = this.tablesRepo.create({
      number: dto.number,
      name: primaryLocalizedText(nameTranslations) || null,
      nameTranslations,
      publicToken: randomUUID(),
      isActive: dto.isActive ?? true,
    });
    const saved = await this.tablesRepo.save(table);
    this.events.emit(TABLE_DOMAIN_EVENTS.CHANGED, { tableId: saved.id });
    return saved;
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
    if (dto.nameTranslations !== undefined) {
      table.nameTranslations = cleanLocalizedText(dto.nameTranslations);
      table.name = primaryLocalizedText(table.nameTranslations) || null;
    } else if (dto.name !== undefined) {
      table.nameTranslations = withLegacyEnglish(
        table.nameTranslations,
        dto.name,
      );
      table.nameTranslations.en = dto.name?.trim() || undefined;
      table.nameTranslations = cleanLocalizedText(table.nameTranslations);
      table.name = primaryLocalizedText(table.nameTranslations) || null;
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
    const saved = await this.tablesRepo.save(table);
    this.events.emit(TABLE_DOMAIN_EVENTS.CHANGED, { tableId: saved.id });
    return saved;
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
