import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VenueSettings } from "src/entities/venue-settings.entity";
import { Repository } from "typeorm";
import { UpdateVenueSettingsDto } from "./dto/update-venue-settings.dto";

const SETTINGS_ID = 1;

@Injectable()
export class VenueSettingsService {
  constructor(
    @InjectRepository(VenueSettings)
    private readonly settingsRepo: Repository<VenueSettings>,
  ) {}

  async get(): Promise<VenueSettings> {
    const existing = await this.settingsRepo.findOne({
      where: { id: SETTINGS_ID },
    });
    if (existing) return existing;

    return this.settingsRepo.save(
      this.settingsRepo.create({
        id: SETTINGS_ID,
        venueName: "SmartServe",
        currency: "AMD",
        timezone: "Asia/Yerevan",
        sauceUnitPrice: 350,
      }),
    );
  }

  async update(dto: UpdateVenueSettingsDto): Promise<VenueSettings> {
    const settings = await this.get();

    if (dto.venueName !== undefined) {
      settings.venueName = dto.venueName.trim();
    }
    if (dto.currency !== undefined) {
      settings.currency = dto.currency.trim().toUpperCase();
    }
    if (dto.timezone !== undefined) {
      settings.timezone = dto.timezone.trim();
    }
    if (dto.sauceUnitPrice !== undefined) {
      settings.sauceUnitPrice = dto.sauceUnitPrice;
    }

    return this.settingsRepo.save(settings);
  }

  async getPublic() {
    const settings = await this.get();
    return {
      venueName: settings.venueName,
      currency: settings.currency,
      sauceUnitPrice: settings.sauceUnitPrice,
    };
  }
}
