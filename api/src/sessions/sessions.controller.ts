import { Body, Controller, Get, Param, Post, Patch } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { OpenSessionDto } from "./dto/open-session.dto";


@Controller('api/sessions')
export class SessionsController {
    constructor (private readonly sessionService: SessionsService){}

    @Post('open')
    open(@Body() dto: OpenSessionDto){
        return this.sessionService.openForTable(dto.table);
    }

    @Get('open')
    listOpen() {
        return this.sessionService.listOpen();
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.sessionService.getByToken(id);
    }

    @Patch(':id/close')
    close(@Param('id') id: string) {
        return this.sessionService.close(id);
    }
    

    
}