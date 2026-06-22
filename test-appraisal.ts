import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PayrollService } from './src/modules/payroll/payroll.service';
import { EmployeesService } from './src/modules/employees/employees.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const employeesService = app.get(EmployeesService);
  const payrollService = app.get(PayrollService);

  const employees = await employeesService.findAll();
  
  if (employees.length === 0) {
    console.log('No employees found.');
    return;
  }

  const emp = employees[0];
  console.log(`Testing with employee ID: ${emp.id}, Name: ${emp.name}`);
  console.log(`Current appraisal: ${emp.appraisal}, Effective: ${emp.appraisal_effective_date}`);

  // Test 1: Generate for May (month 5)
  let calc = await payrollService.calculateSingleEmployee(emp.id, 5, 2026);
  console.log(`May 2026 - Gross: ${calc.grossSalary}, Tax: ${calc.taxDeduction}`);
  
  // Set appraisal
  console.log('\nSetting appraisal to 10000, effective 2026-05-01');
  await employeesService.update(emp.id, {
    appraisal: 10000,
    appraisal_effective_date: '2026-05-01'
  });

  const empAfter = await employeesService.findOne(emp.id);
  console.log(`Appraisal saved: ${empAfter.appraisal}, Effective: ${empAfter.appraisal_effective_date}`);

  // Test 2: Generate again for May
  calc = await payrollService.calculateSingleEmployee(emp.id, 5, 2026);
  console.log(`May 2026 (After) - Gross: ${calc.grossSalary}, Tax: ${calc.taxDeduction}`);

  // Test 3: Generate for April
  calc = await payrollService.calculateSingleEmployee(emp.id, 4, 2026);
  console.log(`April 2026 - Gross: ${calc.grossSalary}, Tax: ${calc.taxDeduction}`);

  // Revert appraisal
  await employeesService.update(emp.id, {
    appraisal: null,
    appraisal_effective_date: null
  });

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
