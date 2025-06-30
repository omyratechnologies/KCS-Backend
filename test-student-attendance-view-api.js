// Test script for Student Attendance View API (Monthly Performance)
const BASE_URL = "http://localhost:3000"; // Adjust according to your server port

async function testStudentAttendanceView() {
    console.log("🧪 Testing Student Attendance View API (Monthly Performance)...\n");

    try {
        // Test 1: Get monthly attendance view for a specific student
        console.log("👤 Test 1: Get monthly attendance view for a student");
        const studentId = "YOUR_STUDENT_ID"; // Replace with actual student ID
        
        const studentViewResponse = await fetch(`${BASE_URL}/attendance/student/${studentId}/view`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_AUTH_TOKEN", // Replace with actual token
            },
        });

        if (studentViewResponse.ok) {
            const studentData = await studentViewResponse.json();
            console.log("✅ Success: Student attendance view retrieved");
            console.log("👤 Student Profile:", JSON.stringify(studentData.student_profile, null, 2));
            console.log("📊 Summary Cards:", JSON.stringify(studentData.summary_cards, null, 2));
            console.log("📈 Additional Stats:", JSON.stringify(studentData.additional_stats, null, 2));
            console.log("📅 Monthly Performance Count:", studentData.monthly_performance.records.length);
            
            // Show top 3 months by performance
            const topMonths = studentData.monthly_performance.records.slice(0, 3);
            console.log("🏆 Recent 3 Months Performance:");
            topMonths.forEach((month, index) => {
                console.log(`   ${index + 1}. ${month.month_year} - ${month.percentage}% (${month.status}) - ${month.present_days}/${month.total_days} days`);
            });

        } else {
            const errorData = await studentViewResponse.json();
            console.log("❌ Error:", studentViewResponse.status, errorData);
        }

        console.log("\n" + "=".repeat(50));

        // Test 2: Get student attendance view with custom date range
        console.log("👤 Test 2: Get student attendance view with date range");
        const fromDate = "2024-01-01";
        const toDate = "2024-06-30";
        
        const dateRangeResponse = await fetch(
            `${BASE_URL}/attendance/student/${studentId}/view?from_date=${fromDate}&to_date=${toDate}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer YOUR_AUTH_TOKEN", // Replace with actual token
                },
            }
        );

        if (dateRangeResponse.ok) {
            const dateRangeData = await dateRangeResponse.json();
            console.log("✅ Success: Custom date range view retrieved");
            console.log("📅 Date Range:", dateRangeData.date_range);
            console.log("📊 Performance Summary:", {
                total_months: dateRangeData.additional_stats.total_months,
                overall_percentage: dateRangeData.summary_cards.attendance_rate.percentage,
                status: dateRangeData.summary_cards.attendance_rate.status
            });
            
            // Show monthly breakdown
            console.log("📈 Monthly Breakdown:");
            dateRangeData.monthly_performance.records.forEach(month => {
                console.log(`   ${month.month_year}: ${month.percentage}% (${month.performance_badge}) - P:${month.present_days} A:${month.absent_days} L:${month.late_days}`);
            });

        } else {
            const errorData = await dateRangeResponse.json();
            console.log("❌ Error:", dateRangeResponse.status, errorData);
        }

        console.log("\n" + "=".repeat(50));

        // Test 3: Error handling - Invalid student ID
        console.log("👤 Test 3: Error handling with invalid student ID");
        const invalidResponse = await fetch(`${BASE_URL}/attendance/student/invalid_student_id/view`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_AUTH_TOKEN", // Replace with actual token
            },
        });

        if (!invalidResponse.ok) {
            const errorData = await invalidResponse.json();
            console.log("✅ Expected error handled correctly:", errorData.message);
        } else {
            console.log("⚠️ Unexpected: No error for invalid student ID");
        }

    } catch (error) {
        console.error("❌ Test failed with error:", error.message);
    }
}

// Usage instructions
console.log(`
📋 Student Attendance View API Test Setup (Monthly Performance):

1. Replace 'YOUR_STUDENT_ID' with an actual student ID from your database
2. Replace 'YOUR_AUTH_TOKEN' with a valid authentication token
3. Ensure your server is running on the correct port
4. Run: node test-student-attendance-view-api.js

📊 Expected Response Structure (Monthly View):
{
  "student_profile": {
    "student_id": "student123",
    "name": "Arjun Reddy",
    "roll_number": "ST001",
    "class": "X - A",
    "contact": "+91 9876543210",
    "email": "arjun.reddy@student.school.com"
  },
  "summary_cards": {
    "total_days": { "count": 120, "label": "TOTAL DAYS" },
    "present_days": { "count": 90, "label": "PRESENT DAYS" },
    "absent_days": { "count": 15, "label": "ABSENT DAYS" },
    "attendance_rate": { "percentage": 75, "status": "good" }
  },
  "monthly_performance": {
    "records": [
      {
        "month": "June",
        "year": 2024,
        "month_year": "June 2024",
        "present_days": 12,
        "absent_days": 2,
        "late_days": 1,
        "total_days": 15,
        "percentage": 87,
        "status": "good"
      }
    ]
  }
}

🔗 API Endpoints:
- GET /attendance/student/:student_id/view
- GET /attendance/student/:student_id/view?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD

🎯 Key Features (Monthly Performance View):
- Student profile information (name, roll number, class, contact)
- Summary cards showing overall statistics
- Monthly performance breakdown instead of daily records
- Percentage and status calculation per month
- Performance badges (excellent/good/average/poor)
- No subject or teacher information (simplified view)
- 12-month default range instead of 30 days
- Monthly aggregation with status tracking

📈 Monthly Performance Benefits:
- Better trend analysis over time
- Reduced data volume for better performance
- Clearer performance patterns
- Easier parent/student review
- Focus on overall attendance rather than daily details
`);

// Uncomment the line below to run the test
// testStudentAttendanceView();
