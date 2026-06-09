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
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tax_slab_entity_1 = require("./tax-slab.entity");
let TaxService = class TaxService {
    constructor(taxSlabRepository) {
        this.taxSlabRepository = taxSlabRepository;
    }
    async create(createDto) {
        const slab = this.taxSlabRepository.create(createDto);
        return this.taxSlabRepository.save(slab);
    }
    async findAll() {
        return this.taxSlabRepository.find({
            order: { financial_year: 'DESC', regime: 'ASC', from_amount: 'ASC' },
        });
    }
    async findByFinancialYear(financialYear) {
        return this.taxSlabRepository.find({
            where: { financial_year: financialYear },
            order: { from_amount: 'ASC' },
        });
    }
    async findByFinancialYearAndRegime(financialYear, regime) {
        return this.taxSlabRepository.find({
            where: { financial_year: financialYear, regime },
            order: { from_amount: 'ASC' },
        });
    }
    async remove(id) {
        await this.taxSlabRepository.delete(id);
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tax_slab_entity_1.TaxSlab)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TaxService);
//# sourceMappingURL=tax.service.js.map