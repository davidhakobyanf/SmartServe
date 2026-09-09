import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ListingService } from './listing.service';
import { ListingController, GuestListingController } from './listing.controller';

@Module({ imports: [UsersModule, SessionsModule], providers: [ListingService], controllers: [ListingController, GuestListingController] })
export class ListingModule {}
