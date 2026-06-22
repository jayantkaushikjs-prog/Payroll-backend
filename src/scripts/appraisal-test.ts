import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PayrollService } from '../modules/payroll/payroll.service';
import { EmployeesService } from '../modules/employees/employees.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const employeeService = app.get(EmployeesService);
  const payrollService = app.get(PayrollService);
  const employees = await employeeService.findAll();
  if (!employees.length) {
    console.log('No employees');
    await app.close();
    return;
  }
  const emp = employees[0];
  console.log('Before appraisal', emp.appraisal, emp.appraisal_effective_date);
  // initial payroll May
  let calc = await payrollService.calculateSingleEmployee(emp.id, 5, 2026);
  console.log('May 2026 before', calc.grossSalary);
  // set appraisal
  await employeeService.update(emp.id, { appraisal: 10000, appraisal_effective_date: '2026-05-01' });
  const updated = await employeeService.findOne(emp.id);
  console.log('After appraisal saved', updated.appraisal, updated.appraisal_effective_date);
  // payroll again May
  calc = await payrollService.calculateSingleEmployee(emp.id, 5, 2026);
  console.log('May 2026 after', calc.grossSalary);
  // payroll April (before effective)
  calc = await payrollService.calculateSingleEmployee(emp.id, 4, 2026);
  console.log('April 2026 after', calc.grossSalary);
  await app.close();
}

main().catch(err => { console.error(err); process.exit(1); });
