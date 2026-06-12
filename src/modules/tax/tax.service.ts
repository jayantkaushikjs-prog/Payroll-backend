import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxSlab } from './tax-slab.entity';
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxSlab)
    private taxSlabRepository: Repository<TaxSlab>,
  ) {}

  async create(createDto: CreateTaxSlabDto): Promise<TaxSlab> {
    const slab = this.taxSlabRepository.create(createDto);
    return this.taxSlabRepository.save(slab);
  }

  async findAll(): Promise<TaxSlab[]> {
    return this.taxSlabRepository.find({
      where: { regime: 'new' },
      order: { financial_year: 'DESC', from_amount: 'ASC' },
    });
  }

  async findByFinancialYear(financialYear: string): Promise<TaxSlab[]> {
    return this.taxSlabRepository.find({
      where: { financial_year: financialYear, regime: 'new' },
      order: { from_amount: 'ASC' },
    });
  }

  async findByFinancialYearAndRegime(financialYear: string, regime: string): Promise<TaxSlab[]> {
    return this.taxSlabRepository.find({
      where: { financial_year: financialYear, regime },
      order: { from_amount: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    await this.taxSlabRepository.delete(id);
  }
}
