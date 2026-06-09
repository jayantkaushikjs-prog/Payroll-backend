"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pf_settings_entity_1 = require("./pf-settings.entity");
const pf_service_1 = require("./pf.service");
const pf_controller_1 = require("./pf.controller");
let PFModule = class PFModule {
};
exports.PFModule = PFModule;
exports.PFModule = PFModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([pf_settings_entity_1.PFSettings])],
        providers: [pf_service_1.PFService],
        controllers: [pf_controller_1.PFController],
        exports: [pf_service_1.PFService],
    })
], PFModule);
//# sourceMappingURL=pf.module.js.map