import { TaxService } from './tax.service';
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';
export declare class TaxController {
    private readonly taxService;
    constructor(taxService: TaxService);
    create(createDto: CreateTaxSlabDto): Promise<import("./tax-slab.entity").TaxSlab>;
    findAll(): Promise<import("./tax-slab.entity").TaxSlab[]>;
    findByFinancialYear(year: string): Promise<import("./tax-slab.entity").TaxSlab[]>;
    remove(id: string): Promise<void>;
}
