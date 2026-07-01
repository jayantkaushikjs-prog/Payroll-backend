const { validateSync } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { CreateEmployeeDto } = require('./dist/modules/employees/dto/create-employee.dto.js');

const dto = plainToInstance(CreateEmployeeDto, {
  employee_code: "123",
  name: "Jayant",
  email: "employee18@techindustan.com",
  personal_email: "",
  department: "IT",
  designation: "Dev",
  joining_date: "2024-01-01",
  bank_name: "HDFC",
  account_number: "1234567890",
  ifsc: "HDFC0001234"
});

const errors = validateSync(dto);
console.log("Errors:", errors.map(e => e.constraints));
