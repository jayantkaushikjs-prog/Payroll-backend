import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  async create(createDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepository.create(createDto);
    return this.expensesRepository.save(expense);
  }

  async findAll(): Promise<Expense[]> {
    return this.expensesRepository.find({
      order: { date: 'DESC', id: 'DESC' },
    });
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

  async getExpensesForMonthAndYear(month: number, year: number): Promise<Expense[]> {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return this.expensesRepository.find({
      where: {
        date: Between(startOfMonth, endOfMonth),
      },
      order: { date: 'ASC' },
    });
  }

  async getCategorySummary(month: number, year: number) {
    const expenses = await this.getExpensesForMonthAndYear(month, year);
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

  async getExpensesTrend(monthsLimit = 6) {
    const trend: { name: string; amount: number }[] = [];
    const now = new Date();
    
    for (let i = monthsLimit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('default', { month: 'short' }) + ' ' + y;
      
      const expenses = await this.getExpensesForMonthAndYear(m, y);
      const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      trend.push({
        name: monthLabel,
        amount: Number(total.toFixed(2)),
      });
    }
    
    return trend;
  }
}
