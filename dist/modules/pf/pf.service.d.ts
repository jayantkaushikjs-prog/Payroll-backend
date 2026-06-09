import { Repository } from 'typeorm';
import { PFSettings } from './pf-settings.entity';
import { CreatePFSettingsDto } from './dto/create-pf-settings.dto';
export declare class PFService {
    private pfSettingsRepository;
    constructor(pfSettingsRepository: Repository<PFSettings>);
    create(createDto: CreatePFSettingsDto): Promise<PFSettings>;
    findAll(): Promise<PFSettings[]>;
    findActiveAtDate(dateString: string): Promise<PFSettings>;
    remove(id: number): Promise<void>;
}
