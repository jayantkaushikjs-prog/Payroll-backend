import { Repository } from 'typeorm';
import { TaxSlab } from './tax-slab.entity';
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';
export declare class TaxService {
    private taxSlabRepository;
    constructor(taxSlabRepository: Repository<TaxSlab>);
    create(createDto: CreateTaxSlabDto): Promise<TaxSlab>;
    findAll(): Promise<TaxSlab[]>;
    findByFinancialYear(financialYear: string): Promise<TaxSlab[]>;
    findByFinancialYearAndRegime(financialYear: string, regime: string): Promise<TaxSlab[]>;
    remove(id: number): Promise<void>;
}
