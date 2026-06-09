import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PFSettings } from './pf-settings.entity';
import { PFService } from './pf.service';
import { PFController } from './pf.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PFSettings])],
  providers: [PFService],
  controllers: [PFController],
  exports: [PFService],
})
export class PFModule {}
