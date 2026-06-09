import { Response } from 'express';
import { Request } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    private getRole;
    getDashboardData(req: Request): Promise<any>;
    downloadPayrollCsv(month: string, year: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadBankTransferCsv(month: string, year: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadPFCsv(month: string, year: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadTaxCsv(month: string, year: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadAdvancesCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadSalaryComponentsCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadPayrollSummaryCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadEmployeeMasterCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadNonPayableDaysCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadJoiningExitCsv(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
