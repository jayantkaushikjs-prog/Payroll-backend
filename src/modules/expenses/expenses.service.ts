import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Expense } from './expense.entity';
import { ExpenseCategory } from './expense-category.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { PayrollService } from '../payroll/payroll.service';
import { AdvancesService } from '../advances/advances.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private categoryRepository: Repository<ExpenseCategory>,
    private payrollService: PayrollService,
    private advancesService: AdvancesService,
  ) {}

  async create(createDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepository.create(createDto);
    return this.expensesRepository.save(expense);
  }

  /**
   * Build dynamic pseudo-expenses from live payroll data for a given month/year.
   * These are not stored in the DB — they are computed on the fly.
   */
  private async buildPayrollPseudoExpenses(month: number, year: number): Promise<Partial<Expense>[]> {
    try {
      const summary = await this.payrollService.getPayrollExpenseSummary(month, year);
      if (summary.status === 'none') return [];

      const statusLabel = summary.status.charAt(0).toUpperCase() + summary.status.slice(1);
      const outstandingAdvances = await this.advancesService.countTotalOutstanding();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-28`;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const pseudoExpenses: Partial<Expense>[] = [];

      if (summary.totalNetSalaries > 0) {
        pseudoExpenses.push({
          id: -1,
          title: `Employee Salaries (${statusLabel})`,
          amount: summary.totalNetSalaries,
          category: 'salary',
          frequency: 'monthly',
          date: dateStr,
          startDate,
          endDate: null,
          description: `Auto-calculated from ${statusLabel.toLowerCase()} payroll for ${month}/${year}`,
          created_at: new Date(),
        } as any);
      }

      if (summary.totalEmployerPF > 0) {
        pseudoExpenses.push({
          id: -2,
          title: `Employer PF Contribution (${statusLabel})`,
          amount: summary.totalEmployerPF,
          category: 'pf',
          frequency: 'monthly',
          date: dateStr,
          startDate,
          endDate: null,
          description: `Auto-calculated employer PF from ${statusLabel.toLowerCase()} payroll for ${month}/${year}`,
          created_at: new Date(),
        } as any);
      }

      if (summary.totalEmployerESI > 0) {
        pseudoExpenses.push({
          id: -3,
          title: `Employer ESI Contribution (${statusLabel})`,
          amount: summary.totalEmployerESI,
          category: 'esi',
          frequency: 'monthly',
          date: dateStr,
          startDate,
          endDate: null,
          description: `Auto-calculated employer ESI from ${statusLabel.toLowerCase()} payroll for ${month}/${year}`,
          created_at: new Date(),
        } as any);
      }

      if (outstandingAdvances > 0) {
        pseudoExpenses.push({
          id: -4,
          title: 'Employee Advances',
          amount: outstandingAdvances,
          category: 'advance',
          frequency: 'monthly',
          date: dateStr,
          startDate,
          endDate: null,
          description: 'Outstanding employee advances treated as company expense for the month',
          created_at: new Date(),
        } as any);
      }

      return pseudoExpenses;
    } catch (error) {
      console.warn('Could not build payroll pseudo-expenses:', error.message);
      return [];
    }
  }

  async findAll(excludeSalaries?: boolean): Promise<Expense[]> {
    const where: any = {};
    if (excludeSalaries) {
      where.category = Not(In(['salary', 'pf', 'esi']));
    }
    const dbExpenses = await this.expensesRepository.find({
      where,
      order: { date: 'DESC', id: 'DESC' },
    });

    // Filter out any old static salary/pf/esi entries from the DB
    const filteredDb = dbExpenses.filter(e => !['salary', 'pf', 'esi'].includes(e.category));

    if (!excludeSalaries) {
      // Add dynamic payroll expenses for the current month
      const now = new Date();
      const pseudoExpenses = await this.buildPayrollPseudoExpenses(now.getMonth() + 1, now.getFullYear());
      return [...pseudoExpenses as Expense[], ...filteredDb];
    }

    return filteredDb;
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: number, updateDto: Partial<CreateExpenseDto>): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, updateDto);
    return this.expensesRepository.save(expense);
  }

  async remove(id: number): Promise<void> {
    const expense = await this.findOne(id);
    await this.expensesRepository.remove(expense);
  }

  async getExpensesForMonthAndYear(month: number, year: number, excludeSalaries?: boolean): Promise<Expense[]> {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const query = this.expensesRepository.createQueryBuilder('expense')
      .where(
        `((expense.frequency = 'one-time' AND expense.date >= :startOfMonth AND expense.date <= :endOfMonth) OR 
         (expense.frequency = 'monthly' AND 
          (expense.startDate IS NOT NULL AND expense.startDate <= :endOfMonth OR expense.startDate IS NULL AND expense.date <= :endOfMonth) AND 
          (expense.endDate IS NULL OR expense.endDate >= :startOfMonth)))`,
        { startOfMonth, endOfMonth }
      );

    // Always exclude static salary/pf/esi from DB results
    query.andWhere('expense.category NOT IN (:...payrollCats)', { payrollCats: ['salary', 'pf', 'esi'] });

    if (excludeSalaries) {
      // No payroll pseudo-expenses needed
      return query.orderBy('expense.date', 'ASC').getMany();
    }

    const dbExpenses = await query.orderBy('expense.date', 'ASC').getMany();

    // Add dynamic payroll pseudo-expenses
    const pseudoExpenses = await this.buildPayrollPseudoExpenses(month, year);
    return [...pseudoExpenses as Expense[], ...dbExpenses];
  }

  async getCategorySummary(month: number, year: number, excludeSalaries?: boolean) {
    const expenses = await this.getExpensesForMonthAndYear(month, year, excludeSalaries);
    const summary: Record<string, number> = {};
    let total = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      const cat = exp.category;
      summary[cat] = (summary[cat] || 0) + amt;
      total += amt;
    }

    return {
      total,
      breakdown: Object.entries(summary).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  }

  async getExpensesTrend(monthsLimit = 6, excludeSalaries?: boolean) {
    const trend: { name: string; amount: number }[] = [];
    const now = new Date();
    
    for (let i = monthsLimit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('default', { month: 'short' }) + ' ' + y;
      
      const expenses = await this.getExpensesForMonthAndYear(m, y, excludeSalaries);
      const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      trend.push({
        name: monthLabel,
        amount: Number(total.toFixed(2)),
      });
    }
    
    return trend;
  }

  async findAllCategories(): Promise<ExpenseCategory[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async createCategory(name: string): Promise<ExpenseCategory> {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) {
      throw new ConflictException('Category name cannot be empty');
    }
    const exists = await this.categoryRepository.findOne({ where: { name: trimmed } });
    if (exists) {
      return exists;
    }
    const cat = this.categoryRepository.create({ name: trimmed });
    return this.categoryRepository.save(cat);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Expense category with ID ${id} not found`);
    }
    await this.categoryRepository.remove(category);
  }
}
