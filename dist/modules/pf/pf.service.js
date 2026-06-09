"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const pf_settings_entity_1 = require("./pf-settings.entity");
let PFService = class PFService {
    constructor(pfSettingsRepository) {
        this.pfSettingsRepository = pfSettingsRepository;
    }
    async create(createDto) {
        let settings = await this.pfSettingsRepository.findOne({
            where: { effective_date: createDto.effective_date },
        });
        if (settings) {
            settings.employee_contribution_rate = createDto.employee_contribution_rate;
            settings.employer_contribution_rate = createDto.employer_contribution_rate;
        }
        else {
            settings = this.pfSettingsRepository.create(createDto);
        }
        return this.pfSettingsRepository.save(settings);
    }
    async findAll() {
        return this.pfSettingsRepository.find({
            order: { effective_date: 'DESC' },
        });
    }
    async findActiveAtDate(dateString) {
        const setting = await this.pfSettingsRepository.findOne({
            where: {
                effective_date: (0, typeorm_1.LessThanOrEqual)(dateString),
            },
            order: { effective_date: 'DESC' },
        });
        if (!setting) {
            const defaultSetting = new pf_settings_entity_1.PFSettings();
            defaultSetting.employee_contribution_rate = 12.00;
            defaultSetting.employer_contribution_rate = 12.00;
            defaultSetting.effective_date = '1970-01-01';
            return defaultSetting;
        }
        return setting;
    }
    async remove(id) {
        await this.pfSettingsRepository.delete(id);
    }
};
exports.PFService = PFService;
exports.PFService = PFService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(pf_settings_entity_1.PFSettings)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], PFService);
//# sourceMappingURL=pf.service.js.map