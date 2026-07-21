import { Controller, Post, Body } from "@nestjs/common";
import { SetupDto } from "./dto/setup.dto";
import { SetupService } from "./setup.service";


@Controller('api/setup')
export class SetupController {
    constructor(private readonly setupService: SetupService) {}

    @Post()
    setup(@Body() dto:SetupDto) {
        return this.setupService.setup(dto);
    }
}