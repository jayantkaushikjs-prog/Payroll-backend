import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxSlab } from './tax-slab.entity';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxSlab])],
  providers: [TaxService],
  controllers: [TaxController],
  exports: [TaxService],
})
export class TaxModule {}
