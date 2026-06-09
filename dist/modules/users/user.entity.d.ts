import { Role } from '../../common/enums/role.enum';
export declare class User {
    id: number;
    email: string;
    password?: string;
    reset_token?: string;
    reset_token_expires?: Date;
    role: Role;
    created_at: Date;
}
