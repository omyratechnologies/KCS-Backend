// Test script for Class Attendance Report API
const BASE_URL = "http://localhost:3000"; // Adjust according to your server port

async function testClassAttendanceReport() {
    console.log("🧪 Testing Class Attendance Report API...\n");

    try {
        // Test 1: Get attendance report for a specific class
        console.log("📊 Test 1: Get attendance report for a class");
        const classId = "YOUR_CLASS_ID"; // Replace with actual class ID
        
        const reportResponse = await fetch(`${BASE_URL}/attendance/report/class/${classId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_AUTH_TOKEN", // Replace with actual token
            },
        });

        if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            console.log("✅ Success: Attendance report retrieved");
            console.log("📈 Report Summary:", JSON.stringify(reportData.summary, null, 2));
            console.log("🎯 Class Info:", JSON.stringify(reportData.class_info, null, 2));
            console.log("📅 Date Range:", JSON.stringify(reportData.date_range, null, 2));
            console.log("👥 Students Count:", reportData.students.length);
            
            // Show top 3 students by attendance
            const topStudents = reportData.students.slice(0, 3);
            console.log("🏆 Top 3 Students by Attendance:");
            topStudents.forEach((student, index) => {
                console.log(`   ${index + 1}. ${student.student_name} (${student.roll_number}) - ${student.percentage}% (${student.status})`);
            });

        } else {
            const errorData = await reportResponse.json();
            console.log("❌ Error:", reportResponse.status, errorData);
        }

        console.log("\n" + "=".repeat(50));

        // Test 2: Get attendance report with custom date range
        console.log("📊 Test 2: Get attendance report with date range");
        const fromDate = "2024-06-01";
        const toDate = "2024-06-30";
        
        const dateRangeResponse = await fetch(
            `${BASE_URL}/attendance/report/class/${classId}?from_date=${fromDate}&to_date=${toDate}`,
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
            console.log("✅ Success: Date range report retrieved");
            console.log("📅 Custom Date Range:", dateRangeData.date_range);
            console.log("📊 Summary:", JSON.stringify(dateRangeData.summary, null, 2));
        } else {
            const errorData = await dateRangeResponse.json();
            console.log("❌ Error:", dateRangeResponse.status, errorData);
        }

        console.log("\n" + "=".repeat(50));

        // Test 3: Error handling - Invalid class ID
        console.log("📊 Test 3: Error handling with invalid class ID");
        const invalidResponse = await fetch(`${BASE_URL}/attendance/report/class/invalid_class_id`, {
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
            console.log("⚠️ Unexpected: No error for invalid class ID");
        }

    } catch (error) {
        console.error("❌ Test failed with error:", error.message);
    }
}

// Usage instructions
console.log(`
📋 Class Attendance Report API Test Setup:

1. Replace 'YOUR_CLASS_ID' with an actual class ID from your database
2. Replace 'YOUR_AUTH_TOKEN' with a valid authentication token
3. Ensure your server is running on the correct port
4. Run: node test-attendance-report-api.js

📊 Expected Response Structure:
{
  "class_info": {
    "class_id": "class123",
    "class_name": "Class X - Section A", 
    "total_students": 35
  },
  "date_range": {
    "from_date": "2024-06-01",
    "to_date": "2024-06-30", 
    "total_days": 30
  },
  "summary": {
    "total_students": 35,
    "average_attendance": 79,
    "excellent_90_plus": 8,
    "good_75_89": 15,
    "average_60_74": 6,
    "needs_attention_below_60": 6
  },
  "students": [...]
}

🔗 API Endpoints:
- GET /attendance/report/class/:class_id
- GET /attendance/report/class/:class_id?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD

🎯 Features Matching Your Dashboard:
- Total Students count
- Average Attendance percentage  
- Excellent (90%+) students
- Needs Attention (<60%) students
- Student-wise breakdown with roll numbers
- Attendance status classification
- Flexible date range filtering
`);

// Uncomment the line below to run the test
// testClassAttendanceReport();
