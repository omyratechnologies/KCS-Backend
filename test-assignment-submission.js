const { ClassService } = require('./src/services/class.service');

async function testAssignmentSubmission() {
    try {
        const classService = new ClassService();
        
        // Test data
        const assignmentId = "test-assignment-123";
        const submissionData = {
            campus_id: "test-campus-123",
            user_id: "test-student-123",
            submission_date: new Date(),
            meta_data: {
                content: "This is my assignment submission",
                files: ["assignment.pdf"],
                notes: "Submitted on time"
            }
        };

        console.log("Creating assignment submission...");
        console.log("Assignment ID:", assignmentId);
        console.log("Submission Data:", submissionData);

        const result = await classService.createAssignmentSubmission(
            assignmentId,
            submissionData
        );

        if (result) {
            console.log("✅ Assignment submission created successfully!");
            console.log("Result:", JSON.stringify(result, null, 2));
        } else {
            console.log("❌ Failed to create assignment submission - returned null");
        }

    } catch (error) {
        console.error("❌ Error testing assignment submission:", error.message);
    }
}

// Run the test
testAssignmentSubmission();
