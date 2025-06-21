# Get Students by Academic Year and Class API Documentation

## Overview

This API provides functionality to retrieve students filtered by academic year and optionally by class_id. It offers multiple ways to query and organize student data for better class management.

## API Endpoints

### 1. Get Students by Academic Year (with optional class filter)

**Endpoint:** `GET /class/students-by-year`

**Description:** Retrieves all students for a specific academic year, optionally filtered by a specific class.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `academic_year` | string | Yes | Academic year to filter by | `2023-2024` |
| `class_id` | string | No | Optional class ID to filter students | `class123` |

#### Example Requests

```bash
# Get all students for academic year 2023-2024
GET /class/students-by-year?academic_year=2023-2024

# Get students from a specific class in academic year 2023-2024
GET /class/students-by-year?academic_year=2023-2024&class_id=class123
```

#### Response Format

```json
{
  "students": [
    {
      "id": "student123",
      "first_name": "John",
      "last_name": "Doe", 
      "email": "john.doe@school.com",
      "phone": "+1234567890",
      "user_type": "student",
      "campus_id": "campus123",
      "address": "123 Main St",
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "academic_year": "2023-2024",
  "total_students": 25,
  "classes_included": [
    {
      "id": "class123",
      "name": "Grade 10A",
      "campus_id": "campus123",
      "academic_year": "2023-2024",
      "class_teacher_id": "teacher123",
      "student_ids": ["student123", "student456"],
      "student_count": 25,
      "teacher_ids": ["teacher123", "teacher456"],
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Students Grouped by Class for Academic Year

**Endpoint:** `GET /class/students-grouped-by-class`

**Description:** Retrieves all students organized by their respective classes for a specific academic year.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `academic_year` | string | Yes | Academic year to filter by | `2023-2024` |

#### Example Request

```bash
GET /class/students-grouped-by-class?academic_year=2023-2024
```

#### Response Format

```json
{
  "academic_year": "2023-2024",
  "total_students": 75,
  "total_classes": 3,
  "classes": [
    {
      "class_info": {
        "id": "class123",
        "name": "Grade 10A",
        "campus_id": "campus123",
        "academic_year": "2023-2024",
        "class_teacher_id": "teacher123",
        "student_ids": ["student123", "student456"],
        "student_count": 25,
        "teacher_ids": ["teacher123", "teacher456"],
        "is_active": true
      },
      "students": [
        {
          "id": "student123",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@school.com",
          "phone": "+1234567890",
          "user_type": "student"
        }
      ],
      "student_count": 25
    }
  ]
}
```

### 3. Get Available Academic Years

**Endpoint:** `GET /class/academic-years`

**Description:** Retrieves all available academic years for the campus.

#### Example Request

```bash
GET /class/academic-years
```

#### Response Format

```json
{
  "academic_years": [
    "2023-2024",
    "2022-2023", 
    "2021-2022"
  ]
}
```

## Usage Examples

### Example 1: Get All Students for Current Academic Year

```javascript
const response = await fetch('/class/students-by-year?academic_year=2023-2024', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Campus-ID': 'your-campus-id'
  }
});

const data = await response.json();
console.log(`Found ${data.total_students} students in ${data.classes_included.length} classes`);

// List all students
data.students.forEach(student => {
  console.log(`${student.first_name} ${student.last_name} (${student.email})`);
});
```

### Example 2: Get Students from Specific Class

```javascript
const response = await fetch('/class/students-by-year?academic_year=2023-2024&class_id=class123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Campus-ID': 'your-campus-id'
  }
});

const data = await response.json();
console.log(`Class: ${data.classes_included[0].name}`);
console.log(`Students: ${data.total_students}`);

// Create student roster
const roster = data.students.map(student => ({
  name: `${student.first_name} ${student.last_name}`,
  email: student.email,
  phone: student.phone
}));

console.table(roster);
```

### Example 3: Get Class-wise Student Distribution

```javascript
const response = await fetch('/class/students-grouped-by-class?academic_year=2023-2024', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Campus-ID': 'your-campus-id'
  }
});

const data = await response.json();

console.log(`Academic Year: ${data.academic_year}`);
console.log(`Total Students: ${data.total_students}`);
console.log(`Total Classes: ${data.total_classes}`);

// Show class-wise breakdown
data.classes.forEach(classData => {
  console.log(`\n${classData.class_info.name}: ${classData.student_count} students`);
  
  classData.students.forEach(student => {
    console.log(`  - ${student.first_name} ${student.last_name}`);
  });
});
```

### Example 4: Generate Student Reports

```javascript
// Get all academic years first
const yearsResponse = await fetch('/class/academic-years');
const yearsData = await yearsResponse.json();

// Generate reports for each year
for (const year of yearsData.academic_years) {
  const studentsResponse = await fetch(`/class/students-grouped-by-class?academic_year=${year}`);
  const studentsData = await studentsResponse.json();
  
  console.log(`\n=== ${year} Academic Year Report ===`);
  console.log(`Total Classes: ${studentsData.total_classes}`);
  console.log(`Total Students: ${studentsData.total_students}`);
  console.log(`Average Students per Class: ${(studentsData.total_students / studentsData.total_classes).toFixed(1)}`);
  
  // Class sizes
  const classSizes = studentsData.classes.map(c => c.student_count);
  console.log(`Largest Class: ${Math.max(...classSizes)} students`);
  console.log(`Smallest Class: ${Math.min(...classSizes)} students`);
}
```

### Example 5: Search Students Across Classes

```javascript
async function findStudentInAcademicYear(studentName, academicYear) {
  const response = await fetch(`/class/students-by-year?academic_year=${academicYear}`);
  const data = await response.json();
  
  const foundStudents = data.students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(studentName.toLowerCase());
  });
  
  if (foundStudents.length > 0) {
    console.log(`Found ${foundStudents.length} student(s) matching "${studentName}":`);
    
    for (const student of foundStudents) {
      // Find which class this student belongs to
      for (const classInfo of data.classes_included) {
        if (classInfo.student_ids.includes(student.id)) {
          console.log(`- ${student.first_name} ${student.last_name} (${classInfo.name})`);
          break;
        }
      }
    }
  } else {
    console.log(`No students found matching "${studentName}" in ${academicYear}`);
  }
}

// Usage
await findStudentInAcademicYear("John", "2023-2024");
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "academic_year query parameter is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "No classes found for academic year: 2023-2024"
}
```

```json
{
  "error": "No class found with ID: invalid-class-id for academic year: 2023-2024"
}
```

### Error Handling in Code

```javascript
async function getStudentsSafely(academicYear, classId = null) {
  try {
    let url = `/class/students-by-year?academic_year=${academicYear}`;
    if (classId) {
      url += `&class_id=${classId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch students');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error.message);
    
    // Return empty result structure for consistent handling
    return {
      students: [],
      academic_year: academicYear,
      total_students: 0,
      classes_included: []
    };
  }
}
```

## Performance Considerations

- **Caching**: Consider caching student data as it doesn't change frequently
- **Pagination**: For large datasets, consider implementing pagination
- **Indexing**: Database indexes on `academic_year` and `campus_id` improve query performance
- **Batch Processing**: Use grouped endpoints for better performance when displaying class-wise data

## Best Practices

1. **Always specify academic year**: The academic year parameter is required for all student queries
2. **Use appropriate endpoint**: Use grouped endpoint for class-wise displays, individual endpoint for searches
3. **Handle empty results**: Always check if students array is empty before processing
4. **Cache academic years**: The list of academic years changes infrequently, so cache it
5. **Validate class_id**: When filtering by class, ensure the class exists in the specified academic year

## Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function StudentsbyYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [studentsData, setStudentsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load academic years on component mount
    fetch('/class/academic-years')
      .then(res => res.json())
      .then(data => {
        setAcademicYears(data.academic_years);
        if (data.academic_years.length > 0) {
          setSelectedYear(data.academic_years[0]); // Select most recent year
        }
      });
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setLoading(true);
      fetch(`/class/students-grouped-by-class?academic_year=${selectedYear}`)
        .then(res => res.json())
        .then(data => {
          setStudentsData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error:', err);
          setLoading(false);
        });
    }
  }, [selectedYear]);

  return (
    <div>
      <h2>Students by Academic Year</h2>
      
      <select 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        <option value="">Select Academic Year</option>
        {academicYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      {loading && <p>Loading...</p>}

      {studentsData && (
        <div>
          <h3>{studentsData.academic_year}</h3>
          <p>Total Students: {studentsData.total_students}</p>
          <p>Total Classes: {studentsData.total_classes}</p>

          {studentsData.classes.map(classData => (
            <div key={classData.class_info.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
              <h4>{classData.class_info.name} ({classData.student_count} students)</h4>
              <ul>
                {classData.students.map(student => (
                  <li key={student.id}>
                    {student.first_name} {student.last_name} - {student.email}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentsbyYear;
```

This comprehensive API allows you to efficiently retrieve and organize student data by academic year and class, making it perfect for generating reports, managing class rosters, and performing student-related operations.
