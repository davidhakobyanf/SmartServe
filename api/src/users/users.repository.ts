import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async saveUser(user: User): Promise<User> {
    return this.usersRepo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: ILike(email) } });
  }

  async findAvatarById(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder("user")
      .addSelect("user.avatarData")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      relations: { role: true },
      order: { createdAt: "DESC" },
    });
  }
}
