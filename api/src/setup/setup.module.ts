import { Module } from '@nestjs/common';
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
    imports:[TypeOrmModule.forFeature([User, Role])],   
    controllers: [SetupController],
    providers: [SetupService],
})

export class SetupModule {}