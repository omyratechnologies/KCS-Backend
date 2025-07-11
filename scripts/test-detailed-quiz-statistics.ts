#!/usr/bin/env node

import { ClassQuizService } from "../src/services/class_quiz.service";

/**
 * Test script for the new detailed quiz statistics API
 * This script demonstrates how to use the new getDetailedQuizStatistics method
 */

async function testDetailedQuizStatistics() {
    console.log("Testing Detailed Quiz Statistics API...");
    
    try {
        // Example usage - replace with actual IDs from your database
        const campusId = "example-campus-id";
        const quizId = "example-quiz-id";
        
        console.log(`\nFetching detailed statistics for quiz: ${quizId}`);
        console.log(`Campus: ${campusId}`);
        
        const result = await ClassQuizService.getDetailedQuizStatistics(
            campusId,
            quizId
        );
        
        console.log("\n✅ API Response:");
        console.log("================");
        console.log(JSON.stringify(result, null, 2));
        
        console.log("\n📊 Statistics Summary:");
        console.log("====================");
        console.log(`Quiz Name: ${result.quiz_info.quiz_name}`);
        console.log(`Class: ${result.quiz_info.class_name}`);
        console.log(`Total Students: ${result.statistics.total_students}`);
        console.log(`Attempted Students: ${result.statistics.attempted_students}`);
        console.log(`Completion Rate: ${result.statistics.completion_percentage}%`);
        console.log(`Average Score: ${result.statistics.average_score}`);
        console.log(`Highest Score: ${result.statistics.highest_score}`);
        console.log(`Lowest Score: ${result.statistics.lowest_score}`);
        
        console.log("\n🏆 Top 3 Students:");
        console.log("==================");
        result.top_three_students.forEach((student, index) => {
            console.log(`${index + 1}. ${student.student_name}`);
            console.log(`   Score: ${student.score}`);
            console.log(`   Completion Time: ${student.completion_time_formatted}`);
            console.log(`   Email: ${student.student_email}`);
            console.log("");
        });
        
        console.log("✅ Test completed successfully!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
        }
    }
}

// API Usage Examples
console.log("🚀 Detailed Quiz Statistics API");
console.log("================================");
console.log("");
console.log("This API provides comprehensive statistics for a quiz including:");
console.log("1. ✅ Attempted students count");
console.log("2. ✅ Total students average");
console.log("3. ✅ Each student's quiz marks");
console.log("4. ✅ Top three students based on marks and completion time");
console.log("");
console.log("📍 Endpoint: GET /class-quiz/detailed-statistics/{quiz_id}");
console.log("");
console.log("📝 Example Response Structure:");
console.log("==============================");
console.log(`{
  "success": true,
  "data": {
    "quiz_info": {
      "id": "quiz-123",
      "quiz_name": "Mathematics Quiz 1",
      "class_name": "Grade 10A",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "statistics": {
      "total_students": 30,
      "attempted_students": 25,
      "completion_percentage": 83,
      "average_score": 78.5,
      "highest_score": 95,
      "lowest_score": 45
    },
    "top_three_students": [
      {
        "student_name": "John Doe",
        "score": 95,
        "completion_time_formatted": "15 minutes, 30 seconds",
        "student_email": "john.doe@example.com"
      },
      {
        "student_name": "Jane Smith",
        "score": 94,
        "completion_time_formatted": "12 minutes, 45 seconds",
        "student_email": "jane.smith@example.com"
      },
      {
        "student_name": "Bob Wilson",
        "score": 90,
        "completion_time_formatted": "18 minutes, 20 seconds",
        "student_email": "bob.wilson@example.com"
      }
    ],
    "all_student_results": [...],
    "summary": {
      "total_attempts": 25,
      "success_rate": 80,
      "average_time_formatted": "16 minutes, 15 seconds"
    }
  }
}`);

// Uncomment the following line to run the actual test
// testDetailedQuizStatistics();

export { testDetailedQuizStatistics };
