#!/bin/bash
# Stop any running pg
/usr/lib/postgresql/14/bin/pg_ctl -D /home/jayant/Desktop/Payroll/backend/db_data stop || true

# Start pg
/usr/lib/postgresql/14/bin/pg_ctl -D /home/jayant/Desktop/Payroll/backend/db_data -o "-k /home/jayant/Desktop/Payroll/backend/db_socket" -l /home/jayant/Desktop/Payroll/backend/pg.log start
sleep 3

export PATH="/home/jayant/.cache/ms-playwright-go/1.57.0:$PATH"
export DB_HOST=127.0.0.1

echo "=== Running Migrations ==="
node ./node_modules/.bin/ts-node ./node_modules/typeorm/cli.js migration:run -d src/config/typeorm.config.ts

echo "=== Seeding Database ==="
node ./node_modules/.bin/ts-node src/seed.ts

echo "=== Starting NestJS ==="
node ./node_modules/@nestjs/cli/bin/nest.js start > nest.log 2>&1 &
NEST_PID=$!

sleep 25

echo "=== NestJS Logs ==="
cat nest.log

echo "=== Logging in ==="
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@payroll.com","password":"Admin@123"}' http://localhost:3000/auth/login)
echo "Login response: $LOGIN_RES"

TOKEN=$(echo $LOGIN_RES | grep -oP '"access_token":"\K[^"]+')
if [ -z "$TOKEN" ]; then
  echo "Failed to get access token!"
  kill $NEST_PID || true
  /usr/lib/postgresql/14/bin/pg_ctl -D /home/jayant/Desktop/Payroll/backend/db_data stop || true
  exit 1
fi

echo "=== Testing GET /employees/departments ==="
curl -w "\nHTTP STATUS: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/employees/departments

echo "=== Testing POST /employees/departments ==="
curl -w "\nHTTP STATUS: %{http_code}\n" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Test Department"}' http://localhost:3000/employees/departments

echo "=== Stopping NestJS ==="
kill $NEST_PID || true
/usr/lib/postgresql/14/bin/pg_ctl -D /home/jayant/Desktop/Payroll/backend/db_data stop || true
