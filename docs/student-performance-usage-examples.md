# Student Performance API - Usage Examples

This file contains practical examples of how to use the Student Performance API in different scenarios.

## 1. Student Dashboard Implementation

### Frontend Component (React/Vue/Angular)

```javascript
// StudentPerformanceDashboard.js
import React, { useState, useEffect } from 'react';

const StudentPerformanceDashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [performanceSummary, setPerformanceSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState('');

    useEffect(() => {
        fetchPerformanceData();
        fetchPerformanceSummary();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            const response = await fetch('/api/student-performance/my-performance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });
            
            const data = await response.json();
            if (data.success) {
                setPerformanceData(data.data);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceSummary = async () => {
        try {
            const response = await fetch('/api/student-performance/my-performance/summary', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });
            
            const data = await response.json();
            if (data.success) {
                setPerformanceSummary(data.data);
            }
        } catch (error) {
            console.error('Error fetching performance summary:', error);
        }
    };

    const fetchSemesterPerformance = async (semester, academicYear) => {
        try {
            const response = await fetch(
                `/api/student-performance/my-performance?semester=${semester}&academic_year=${academicYear}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    }
                }
            );
            
            const data = await response.json();
            if (data.success) {
                // Handle semester-specific data
                setPerformanceData(data.data);
            }
        } catch (error) {
            console.error('Error fetching semester performance:', error);
        }
    };

    if (loading) return <div>Loading performance data...</div>;

    return (
        <div className="student-performance-dashboard">
            <h1>Academic Performance</h1>
            
            {/* Performance Summary */}
            {performanceSummary && (
                <div className="performance-summary">
                    <h2>Overall Performance</h2>
                    <div className="summary-stats">
                        <div className="stat">
                            <label>Overall GPA</label>
                            <span>{performanceSummary.overall_gpa.toFixed(2)}</span>
                        </div>
                        <div className="stat">
                            <label>Overall Percentage</label>
                            <span>{performanceSummary.overall_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="stat">
                            <label>Total Semesters</label>
                            <span>{performanceSummary.total_semesters}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Semester Performance */}
            <div className="semester-performance">
                <h2>Semester Performance</h2>
                {performanceData.map((semester, index) => (
                    <div key={index} className="semester-card">
                        <h3>{semester.semester} {semester.academic_year}</h3>
                        
                        <div className="performance-metrics">
                            <div className="metric">
                                <label>GPA</label>
                                <span>{semester.performance_data.overall_gpa}</span>
                            </div>
                            <div className="metric">
                                <label>Percentage</label>
                                <span>{semester.performance_data.overall_percentage}%</span>
                            </div>
                            <div className="metric">
                                <label>Rank</label>
                                <span>{semester.performance_data.rank}/{semester.performance_data.total_students}</span>
                            </div>
                            <div className="metric">
                                <label>Attendance</label>
                                <span>{semester.attendance.attendance_percentage}%</span>
                            </div>
                        </div>

                        {/* Subject-wise Performance */}
                        <div className="subjects">
                            <h4>Subject Performance</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Marks</th>
                                        <th>Percentage</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semester.performance_data.subjects.map((subject, idx) => (
                                        <tr key={idx}>
                                            <td>{subject.subject_name}</td>
                                            <td>{subject.marks_obtained}/{subject.total_marks}</td>
                                            <td>{subject.percentage}%</td>
                                            <td>{subject.grade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentPerformanceDashboard;
```

## 2. Teacher/Admin Management Interface

```javascript
// TeacherPerformanceManager.js
import React, { useState } from 'react';

const TeacherPerformanceManager = () => {
    const [studentId, setStudentId] = useState('');
    const [semester, setSemester] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [classId, setClassId] = useState('');
    const [performanceData, setPerformanceData] = useState(null);

    const calculateStudentPerformance = async () => {
        try {
            const response = await fetch('/api/student-performance/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    student_id: studentId,
                    semester: semester,
                    academic_year: academicYear,
                    class_id: classId
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Performance calculated and saved successfully!');
                setPerformanceData(data.data);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error calculating performance:', error);
            alert('Error calculating performance');
        }
    };

    const fetchStudentPerformance = async () => {
        try {
            const response = await fetch(
                `/api/student-performance/${studentId}/semester/${semester}?academic_year=${academicYear}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    }
                }
            );

            const data = await response.json();
            if (data.success) {
                setPerformanceData(data.data);
            } else {
                alert('Performance data not found');
            }
        } catch (error) {
            console.error('Error fetching performance:', error);
        }
    };

    const createCustomPerformance = async (customData) => {
        try {
            const response = await fetch('/api/student-performance/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    student_id: studentId,
                    academic_year: academicYear,
                    semester: semester,
                    class_id: classId,
                    ...customData
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Performance data saved successfully!');
                setPerformanceData(data.data);
            }
        } catch (error) {
            console.error('Error saving performance:', error);
        }
    };

    return (
        <div className="teacher-performance-manager">
            <h1>Student Performance Management</h1>

            <div className="form-section">
                <h2>Student Information</h2>
                <input
                    type="text"
                    placeholder="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Semester (e.g., Fall, Spring)"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Academic Year (e.g., 2024-25)"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Class ID"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                />
            </div>

            <div className="action-buttons">
                <button onClick={calculateStudentPerformance}>
                    Calculate Performance from Raw Data
                </button>
                <button onClick={fetchStudentPerformance}>
                    Fetch Existing Performance
                </button>
            </div>

            {performanceData && (
                <div className="performance-display">
                    <h2>Performance Data</h2>
                    <pre>{JSON.stringify(performanceData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default TeacherPerformanceManager;
```

## 3. Mobile App Integration (React Native)

```javascript
// PerformanceService.js
class PerformanceService {
    constructor(apiBase, authToken) {
        this.apiBase = apiBase;
        this.authToken = authToken;
    }

    async getMyPerformance() {
        try {
            const response = await fetch(`${this.apiBase}/student-performance/my-performance`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                }
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('Failed to fetch performance data');
        }
    }

    async getPerformanceSummary() {
        try {
            const response = await fetch(`${this.apiBase}/student-performance/my-performance/summary`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                }
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('Failed to fetch performance summary');
        }
    }

    async getSemesterPerformance(semester, academicYear) {
        try {
            const url = `${this.apiBase}/student-performance/my-performance?semester=${semester}&academic_year=${academicYear}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                }
            });
            
            return await response.json();
        } catch (error) {
            throw new Error('Failed to fetch semester performance');
        }
    }
}

// React Native Component
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';

const PerformanceScreen = ({ authToken }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const performanceService = new PerformanceService('https://api.yourschool.com/api', authToken);

    useEffect(() => {
        loadPerformanceData();
    }, []);

    const loadPerformanceData = async () => {
        try {
            const [performanceResponse, summaryResponse] = await Promise.all([
                performanceService.getMyPerformance(),
                performanceService.getPerformanceSummary()
            ]);

            if (performanceResponse.success) {
                setPerformanceData(performanceResponse.data);
            }

            if (summaryResponse.success) {
                setSummary(summaryResponse.data);
            }
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading performance data...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Academic Performance</Text>

            {summary && (
                <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Overall Performance</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>GPA</Text>
                            <Text style={styles.statValue}>{summary.overall_gpa.toFixed(2)}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Percentage</Text>
                            <Text style={styles.statValue}>{summary.overall_percentage.toFixed(1)}%</Text>
                        </View>
                    </View>
                </View>
            )}

            {performanceData.map((semester, index) => (
                <View key={index} style={styles.semesterCard}>
                    <Text style={styles.semesterTitle}>
                        {semester.semester} {semester.academic_year}
                    </Text>
                    
                    <View style={styles.metricsGrid}>
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>GPA</Text>
                            <Text style={styles.metricValue}>
                                {semester.performance_data.overall_gpa}
                            </Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Percentage</Text>
                            <Text style={styles.metricValue}>
                                {semester.performance_data.overall_percentage}%
                            </Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Rank</Text>
                            <Text style={styles.metricValue}>
                                {semester.performance_data.rank}/{semester.performance_data.total_students}
                            </Text>
                        </View>
                        <View style={styles.metric}>
                            <Text style={styles.metricLabel}>Attendance</Text>
                            <Text style={styles.metricValue}>
                                {semester.attendance.attendance_percentage}%
                            </Text>
                        </View>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    semesterCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
    },
    semesterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metric: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 12,
        color: '#666',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default PerformanceScreen;
```

## 4. Backend Integration with Existing Systems

```javascript
// PerformanceCalculationService.js
// This would be used to automatically calculate performance when grades are updated

class PerformanceCalculationService {
    static async updateStudentPerformanceOnGradeChange(studentId, examId, newGrade) {
        try {
            // Get student's current semester and academic year
            const studentInfo = await this.getStudentCurrentSemester(studentId);
            
            if (studentInfo) {
                // Recalculate performance metrics
                const response = await fetch('/api/student-performance/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAdminToken()}`,
                    },
                    body: JSON.stringify({
                        student_id: studentId,
                        semester: studentInfo.semester,
                        academic_year: studentInfo.academic_year,
                        class_id: studentInfo.class_id
                    })
                });

                const data = await response.json();
                if (data.success) {
                    console.log(`Performance updated for student ${studentId}`);
                    
                    // Notify student about updated performance
                    await this.notifyStudentOfPerformanceUpdate(studentId, data.data);
                }
            }
        } catch (error) {
            console.error('Error updating student performance:', error);
        }
    }

    static async bulkCalculatePerformanceForClass(classId, semester, academicYear) {
        try {
            // Get all students in the class
            const students = await this.getStudentsInClass(classId);
            
            const calculations = students.map(student => 
                fetch('/api/student-performance/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAdminToken()}`,
                    },
                    body: JSON.stringify({
                        student_id: student.id,
                        semester: semester,
                        academic_year: academicYear,
                        class_id: classId
                    })
                })
            );

            const results = await Promise.all(calculations);
            
            console.log(`Bulk performance calculation completed for ${results.length} students`);
            return results;
        } catch (error) {
            console.error('Error in bulk performance calculation:', error);
            throw error;
        }
    }

    static async generatePerformanceReport(studentId, academicYears) {
        try {
            const response = await fetch(
                `/api/student-performance/${studentId}/summary?academic_years=${academicYears.join(',')}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.getAdminToken()}`,
                    }
                }
            );

            const data = await response.json();
            if (data.success) {
                return this.formatPerformanceReport(data.data);
            }
        } catch (error) {
            console.error('Error generating performance report:', error);
            throw error;
        }
    }

    // Helper methods would be implemented based on your existing systems
    static async getStudentCurrentSemester(studentId) {
        // Implementation depends on your student/class models
    }

    static getAdminToken() {
        // Return admin/system token for API calls
    }

    static async notifyStudentOfPerformanceUpdate(studentId, performanceData) {
        // Send notification to student about updated performance
    }

    static async getStudentsInClass(classId) {
        // Get all students in a class
    }

    static formatPerformanceReport(performanceData) {
        // Format data for report generation
        return {
            student_info: performanceData,
            generated_at: new Date().toISOString(),
            // Add more formatting as needed
        };
    }
}

module.exports = PerformanceCalculationService;
```

## 5. Scheduled Performance Calculations

```javascript
// ScheduledPerformanceUpdates.js
// Example using cron jobs to automatically update performance data

const cron = require('node-cron');
const PerformanceCalculationService = require('./PerformanceCalculationService');

class ScheduledPerformanceUpdates {
    static setupScheduledJobs() {
        // Update performance data daily at 2 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('Starting daily performance update...');
            try {
                await this.dailyPerformanceUpdate();
                console.log('Daily performance update completed');
            } catch (error) {
                console.error('Error in daily performance update:', error);
            }
        });

        // Weekly performance summary generation (Sundays at 6 AM)
        cron.schedule('0 6 * * 0', async () => {
            console.log('Starting weekly performance summary generation...');
            try {
                await this.weeklyPerformanceSummary();
                console.log('Weekly performance summary completed');
            } catch (error) {
                console.error('Error in weekly performance summary:', error);
            }
        });
    }

    static async dailyPerformanceUpdate() {
        // Get all active classes and update performance for students with new grades
        const activeClasses = await this.getActiveClasses();
        
        for (const classInfo of activeClasses) {
            await PerformanceCalculationService.bulkCalculatePerformanceForClass(
                classInfo.id,
                classInfo.current_semester,
                classInfo.academic_year
            );
        }
    }

    static async weeklyPerformanceSummary() {
        // Generate and send weekly performance summaries to students and parents
        const students = await this.getAllActiveStudents();
        
        for (const student of students) {
            const summary = await PerformanceCalculationService.generatePerformanceReport(
                student.id,
                [student.current_academic_year]
            );
            
            // Send summary via email/notification
            await this.sendPerformanceSummary(student, summary);
        }
    }

    // Helper methods
    static async getActiveClasses() {
        // Implementation to get active classes
    }

    static async getAllActiveStudents() {
        // Implementation to get all active students
    }

    static async sendPerformanceSummary(student, summary) {
        // Implementation to send performance summary
    }
}

// Start scheduled jobs
ScheduledPerformanceUpdates.setupScheduledJobs();

module.exports = ScheduledPerformanceUpdates;
```

These examples show how to integrate the Student Performance API into various parts of your application ecosystem, from frontend dashboards to automated backend processes.
