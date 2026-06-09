import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByResetToken(token: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    save(user: User): Promise<User>;
    findAll(): Promise<User[]>;
    remove(id: number): Promise<void>;
}
