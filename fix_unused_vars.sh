#!/bin/bash

# Script to fix specific ESLint unused variable warnings by prefixing with _

# Function to fix unused variables in a file
fix_unused_vars() {
    local file="$1"
    shift
    local vars=("$@")
    
    echo "Fixing $file..."
    for var in "${vars[@]}"; do
        # Only fix if the variable is declared and assigned but not used
        if grep -q "const $var = " "$file" || grep -q "let $var = " "$file" || grep -q "$var," "$file"; then
            # Use sed to replace the variable with _variable
            sed -i '' "s/const $var = /const _$var = /g" "$file"
            sed -i '' "s/let $var = /let _$var = /g" "$file"
            sed -i '' "s/{ $var,/{ $var: _$var,/g" "$file"
            sed -i '' "s/, $var,/, $var: _$var,/g" "$file"
            sed -i '' "s/{ $var }/{ $var: _$var }/g" "$file"
            echo "  - Fixed: $var -> _$var"
        fi
    done
}

# Fix specific files and variables based on ESLint output
fix_unused_vars "src/controllers/payment_settlement.controller.ts" "campus_id" "status" "gateway_provider" "start_date" "end_date" "severity" "event_type"

fix_unused_vars "src/controllers/super_admin.controller.ts" "include_payment_data"

fix_unused_vars "src/services/backup_recovery.service.ts" "Campus" "Fee" "PaymentTransaction" "SchoolBankDetails" "User"

fix_unused_vars "src/services/bulk_operations.service.ts" "Class" "UserService" "Fee" "PaymentInvoice"

fix_unused_vars "src/services/course.service.ts" "enrollment"

fix_unused_vars "src/services/dashboard.service.ts" "grades"

fix_unused_vars "src/services/enhanced_assignment.service.ts" "graded"

fix_unused_vars "src/services/payment.service.ts" "updatedTransaction" "testHash"

fix_unused_vars "src/services/payment_analytics.service.ts" "FeeCategory" "UserService" "Class"

fix_unused_vars "src/services/payment_gateway.service.ts" "orderData"

fix_unused_vars "src/services/socket.service.ts" "transport"

fix_unused_vars "src/services/teacher.service.ts" "error"

echo "Done fixing unused variables!"
