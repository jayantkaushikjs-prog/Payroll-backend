import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PFSettings } from './pf-settings.entity';
import { CreatePFSettingsDto } from './dto/create-pf-settings.dto';

@Injectable()
export class PFService {
  constructor(
    @InjectRepository(PFSettings)
    private pfSettingsRepository: Repository<PFSettings>,
  ) {}

  async create(createDto: CreatePFSettingsDto): Promise<PFSettings> {
    let settings = await this.pfSettingsRepository.findOne({
      where: { effective_date: createDto.effective_date },
    });

    if (settings) {
      settings.employee_contribution_rate = createDto.employee_contribution_rate;
      settings.employer_contribution_rate = createDto.employer_contribution_rate;
    } else {
      settings = this.pfSettingsRepository.create(createDto);
    }

    return this.pfSettingsRepository.save(settings);
  }

  async findAll(): Promise<PFSettings[]> {
    return this.pfSettingsRepository.find({
      order: { effective_date: 'DESC' },
    });
  }

  async findActiveAtDate(dateString: string): Promise<PFSettings> {
    // Finds the setting with the largest effective_date <= dateString
    const setting = await this.pfSettingsRepository.findOne({
      where: {
        effective_date: LessThanOrEqual(dateString),
      },
      order: { effective_date: 'DESC' },
    });

    if (!setting) {
      // Return a default fallback if no settings have been configured yet
      const defaultSetting = new PFSettings();
      defaultSetting.employee_contribution_rate = 12.00;
      defaultSetting.employer_contribution_rate = 12.00;
      defaultSetting.effective_date = '1970-01-01';
      return defaultSetting;
    }

    return setting;
  }

  async remove(id: number): Promise<void> {
    await this.pfSettingsRepository.delete(id);
  }
}
