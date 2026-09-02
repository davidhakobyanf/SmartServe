import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ProfileService {
  getProfile(user: User) {
    return {
      name: user.name,
      surname: user.surname,
      email: user.email,
      card: [],
    };
  }
}
