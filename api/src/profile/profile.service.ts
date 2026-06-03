import { Injectable, NotFoundException } from '@nestjs/common';
import { sanitizeMenuCards } from '../common/utils/menu-card-response.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  async getProfile() {
    const user = await this.usersService.getActiveUser();
    if (!user) {
      throw new NotFoundException({ error: 'No profiles found' });
    }

    return {
      name: user.name,
      surname: user.surname,
      card: sanitizeMenuCards(user.cards ?? []),
    };
  }
}
