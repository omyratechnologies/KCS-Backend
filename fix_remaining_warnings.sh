#!/bin/bash

# Fix remaining ESLint warnings by prefixing with underscore

echo "Fixing remaining unused variables..."

# Fix import statements - comment out unused imports
sed -i '' 's/import { Campus/\/\/ import { Campus/' src/services/backup_recovery.service.ts
sed -i '' 's/import { Fee/\/\/ import { Fee/' src/services/backup_recovery.service.ts  
sed -i '' 's/import { PaymentTransaction/\/\/ import { PaymentTransaction/' src/services/backup_recovery.service.ts
sed -i '' 's/import { SchoolBankDetails/\/\/ import { SchoolBankDetails/' src/services/backup_recovery.service.ts
sed -i '' 's/import { User/\/\/ import { User/' src/services/backup_recovery.service.ts

# Fix crypto import
sed -i '' 's/import crypto/import crypto as _crypto/' src/services/meeting.service.ts

# Fix type imports by commenting them out
sed -i '' 's/IClassData/\/\/ IClassData/' src/services/class_quiz.service.ts
sed -i '' 's/IUser/\/\/ IUser/' src/services/class_quiz.service.ts
sed -i '' 's/ICourseCertificateData/\/\/ ICourseCertificateData/' src/services/course.service.ts
sed -i '' 's/CourseProgress/\/\/ CourseProgress/' src/services/dashboard.service.ts
sed -i '' 's/UserService/\/\/ UserService/' src/services/enhanced_assignment.service.ts

# Fix payment service imports
sed -i '' 's/PaymentGatewayCredentials/\/\/ PaymentGatewayCredentials/' src/services/payment.service.ts
sed -i '' 's/PaymentGatewayConfig/\/\/ PaymentGatewayConfig/' src/services/payment.service.ts

# Fix settlement service imports
sed -i '' 's/ISchoolBankDetails/\/\/ ISchoolBankDetails/' src/services/payment_settlement.service.ts

# Fix webrtc imports
sed -i '' 's/uuidv4/\/\/ uuidv4/' src/services/webrtc.service.ts
sed -i '' 's/IMeetingData/\/\/ IMeetingData/' src/services/webrtc.service.ts
sed -i '' 's/IMeetingParticipant/\/\/ IMeetingParticipant/' src/services/webrtc.service.ts
sed -i '' 's/MeetingChat/\/\/ MeetingChat/' src/services/webrtc.service.ts

# Fix student performance imports
sed -i '' 's/import { Class/\/\/ import { Class/' src/services/student_performance.service.ts
sed -i '' 's/import { ExamTerm/\/\/ import { ExamTerm/' src/services/student_performance.service.ts

# Fix encrypted credential import
sed -i '' 's/EncryptedCredential/\/\/ EncryptedCredential/' src/services/secure_payment_credential.service.ts

# Fix test imports
sed -i '' 's/afterAll/\/\/ afterAll/' tests/integration/health-api-config.test.ts
sed -i '' 's/beforeAll/\/\/ beforeAll/' tests/integration/health-api-config.test.ts

# Fix route imports - comment out unused schemas
sed -i '' 's/getAttendanceByClassIdAndDateRequestBodySchema/\/\/ getAttendanceByClassIdAndDateRequestBodySchema/' src/routes/attendance.route.ts
sed -i '' 's/courseEnrollmentResponseSchema/\/\/ courseEnrollmentResponseSchema/' src/routes/course.route.ts
sed -i '' 's/courseProgressResponseSchema/\/\/ courseProgressResponseSchema/' src/routes/course.route.ts
sed -i '' 's/strictMeetingRateLimit/\/\/ strictMeetingRateLimit/' src/routes/meeting.route.ts
sed -i '' 's/roleMiddleware/\/\/ roleMiddleware/' src/routes/payment.route.ts
sed -i '' 's/roleMiddleware/\/\/ roleMiddleware/' src/routes/payment_settlement.route.ts
sed -i '' 's/errorResponseSchema/\/\/ errorResponseSchema/' src/routes/payment.route.ts
sed -i '' 's/paymentTransactionSchema/\/\/ paymentTransactionSchema/' src/routes/payment.route.ts

echo "Fixing function parameters with underscore prefix..."

# Fix function parameters by adding underscore prefix
sed -i '' 's/class_id)/\_class_id)/' src/services/class_quiz.service.ts
sed -i '' 's/user_id,/\_user_id,/' src/services/course.service.ts
sed -i '' 's/filters)/\_filters)/' src/services/enhanced_assignment.service.ts
sed -i '' 's/error)/\_error)/' src/services/enhanced_assignment.service.ts
sed -i '' 's/range)/\_range)/' src/services/payment_analytics.service.ts
sed -i '' 's/verification)/\_verification)/' src/services/payment_gateway.service.ts
sed -i '' 's/content)/\_content)/' src/services/payment_notification.service.ts

# Fix settlement service function parameters
sed -i '' 's/settlement,/\_settlement,/' src/services/payment_settlement.service.ts
sed -i '' 's/gateway_config)/\_gateway_config)/' src/services/payment_settlement.service.ts
sed -i '' 's/gateway_provider,/\_gateway_provider,/' src/services/payment_settlement.service.ts
sed -i '' 's/configuration)/\_configuration)/' src/services/payment_settlement.service.ts
sed -i '' 's/campus_id,/\_campus_id,/' src/services/payment_settlement.service.ts
sed -i '' 's/new_primary_gateway)/\_new_primary_gateway)/' src/services/payment_settlement.service.ts
sed -i '' 's/webhook_data,/\_webhook_data,/' src/services/payment_settlement.service.ts
sed -i '' 's/signature)/\_signature)/' src/services/payment_settlement.service.ts
sed -i '' 's/request_context)/\_request_context)/' src/services/payment_settlement.service.ts
sed -i '' 's/configs)/\_configs)/' src/services/payment_settlement.service.ts
sed -i '' 's/data)/\_data)/' src/services/payment_settlement.service.ts

# Fix student performance parameters
sed -i '' 's/student_id,/\_student_id,/' src/services/student_performance.service.ts
sed -i '' 's/semester,/\_semester,/' src/services/student_performance.service.ts
sed -i '' 's/academic_year)/\_academic_year)/' src/services/student_performance.service.ts

# Fix test parameters
sed -i '' 's/email,/\_email,/' tests/unit/auth.controller.test.ts
sed -i '' 's/password)/\_password)/' tests/unit/auth.controller.test.ts

echo "Done fixing remaining unused variables!"
