import { PFService } from './pf.service';
import { CreatePFSettingsDto } from './dto/create-pf-settings.dto';
export declare class PFController {
    private readonly pfService;
    constructor(pfService: PFService);
    create(createDto: CreatePFSettingsDto): Promise<import("./pf-settings.entity").PFSettings>;
    findAll(): Promise<import("./pf-settings.entity").PFSettings[]>;
    findActive(date?: string): Promise<import("./pf-settings.entity").PFSettings>;
    remove(id: string): Promise<void>;
}
