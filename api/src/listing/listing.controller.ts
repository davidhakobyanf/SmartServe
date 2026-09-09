import { Controller, Get, Headers, Query, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OpenSessionGuard, RequestWithSession } from '../common/guards/open-session.guard';
import { RequirePermissions } from '../common/auth/permissions.decorator';
import { Permission } from '../common/auth/permission';
import { getEffectivePermissions } from '../common/auth/effective-permissions';
import { User } from '../entities/user.entity';
import { ListingService } from './listing.service';
import { ListQueryDto } from './list-query.dto';

@Controller('api/lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ListingController {
  constructor(private readonly listing: ListingService) {}
  @Get('products') @RequirePermissions(Permission.MENU_VIEW)
  products(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.products(query, locale); }
  @Get('categories') @RequirePermissions(Permission.MENU_VIEW)
  categories(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.assets('categories', query, locale); }
  @Get('sauces') @RequirePermissions(Permission.MENU_VIEW)
  sauces(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.assets('sauces', query, locale); }
  @Get('orders') @RequirePermissions(Permission.ORDERS_VIEW)
  orders(@Query() query: ListQueryDto, @CurrentUser() user: User) { return this.listing.orders(query, getEffectivePermissions(user).includes(Permission.REVENUE_VIEW)); }
  @Get('users') @RequirePermissions(Permission.USERS_VIEW)
  users(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.users(query, locale); }
  @Get('roles') @RequirePermissions(Permission.ROLES_MANAGE)
  roles(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.roles(query, locale); }
  @Get('tables') @RequirePermissions(Permission.TABLES_VIEW)
  tables(@Query() query: ListQueryDto, @CurrentUser() user: User, @Headers('accept-language') locale?: string) { return this.listing.tables(query, user, locale); }
}

@Controller('api/guest-lists')
@UseGuards(OpenSessionGuard)
export class GuestListingController {
  constructor(private readonly listing: ListingService) {}
  @Get('products')
  products(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.products(query, locale, true); }
  @Get('categories')
  categories(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.assets('categories', query, locale, true); }
  @Get('sauces')
  sauces(@Query() query: ListQueryDto, @Headers('accept-language') locale?: string) { return this.listing.assets('sauces', query, locale, true); }
  @Get('orders')
  orders(@Query() query: ListQueryDto, @Req() req: RequestWithSession) { return this.listing.orders(query, true, req.diningSession!.id); }
}
