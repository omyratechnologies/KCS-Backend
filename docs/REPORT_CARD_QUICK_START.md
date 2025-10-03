# Monthly Report Card - Quick Start Guide

## For Teachers/Admins

### Step 1: Generate a Report Card

Generate a monthly report card for a student:

```bash
curl -X POST "http://your-api-url/api/report-cards/generate/student_123?month=2024-03" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response will include complete report card with auto-calculated metrics.

### Step 2: Add Teacher Remarks (Optional)

Update the report card with personalized feedback:

```bash
curl -X PATCH "http://your-api-url/api/report-cards/report_456/remarks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacher_remarks": [
      {
        "subject_id": "math_101",
        "subject_name": "Mathematics",
        "teacher_name": "Mr. Smith",
        "remarks": "Excellent progress this month",
        "strengths": ["Problem solving", "Quick learner"],
        "areas_for_improvement": ["Show more work in solutions"]
      }
    ],
    "achievements": [
      "Won mathematics quiz competition",
      "Perfect attendance award"
    ]
  }'
```

### Step 3: Publish the Report Card

Make the report visible to the student:

```bash
curl -X POST "http://your-api-url/api/report-cards/report_456/publish" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Finalize (Admin Only - Optional)

Lock the report card from further edits:

```bash
curl -X POST "http://your-api-url/api/report-cards/report_456/finalize" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## For Students

### View Your Report Card

Get your report card for a specific month:

```bash
curl -X GET "http://your-api-url/api/report-cards/my-report?month=2024-03" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Important Notes

### Month Format
- Always use format: `YYYY-MM` (e.g., "2024-03" for March 2024)
- Month must be in the past or current month

### Report States
1. **Draft**: Generated but not visible to students
2. **Published**: Visible to students
3. **Final**: Published and locked (no more edits)

### What Gets Included Automatically

The system automatically includes:
- ✅ Attendance records for the month
- ✅ Exam marks and grades
- ✅ Assignment submissions and scores
- ✅ Quiz attempts and scores
- ✅ Course progress
- ✅ Behavioral metrics (discipline, participation, punctuality)
- ✅ Overall performance calculations

### What You Can Add Manually

Teachers can add:
- 📝 Subject-wise remarks
- 🎯 Strengths and areas for improvement
- 🏆 Achievements
- 🎭 Co-curricular activities participation

## Common Workflows

### Monthly Report Generation Process

**End of Each Month:**
1. Generate reports for all students
2. Review auto-calculated metrics
3. Add teacher remarks and feedback
4. Publish reports
5. Notify students (manual or automated)

### Quarterly Review
1. Generate reports for all 3 months
2. View comprehensive student progress
3. Identify trends and patterns
4. Plan interventions if needed

## Troubleshooting

### "Report card not found"
- Ensure the month parameter is correct (YYYY-MM format)
- Check if report has been published (students can only see published reports)
- Verify the student_id is correct

### "Unauthorized" Error
- Check your authentication token
- Verify you have the correct permissions
- Students can only view their own reports

### Empty or Incomplete Data
- Ensure attendance has been marked for the month
- Check that exams/assignments have been graded
- Verify the student was enrolled in classes during that month

## Tips for Best Results

1. **Mark attendance regularly** - Attendance data is crucial for accurate reports
2. **Grade assignments promptly** - Graded work is included in performance calculations
3. **Add remarks before publishing** - Personal feedback adds value
4. **Review before finalizing** - Finalized reports cannot be edited
5. **Generate at month-end** - Ensures complete data for the entire month

## Need Help?

- 📖 Full API Documentation: `/docs/MONTHLY_REPORT_CARD_API.md`
- 📋 Implementation Details: `/docs/REPORT_CARD_IMPLEMENTATION_SUMMARY.md`
- 🔧 Backend Developer Guide: `/docs/BACKEND_DEVELOPER_GUIDE.md`

## Example Response Structure

```json
{
  "success": true,
  "data": {
    "report_id": "report_123",
    "student_info": { ... },
    "academic_info": { 
      "academic_year": "2023-2024",
      "month": "2024-03",
      "month_name": "March"
    },
    "attendance": {
      "total_days": 22,
      "present": 20,
      "attendance_percentage": 90.91
    },
    "subjects_performance": [ ... ],
    "overall_performance": {
      "overall_percentage": 85.1,
      "overall_grade": "A",
      "overall_gpa": 4.0
    },
    "behavioral_metrics": { ... },
    "teacher_remarks": [ ... ]
  }
}
```
