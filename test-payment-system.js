/**
 * Payment System API Test Script
 * 
 * This script demonstrates how to use the new payment system APIs.
 * Make sure to start the server before running these tests.
 */

const API_BASE = 'http://localhost:3000'; // Adjust port as needed

// Mock authentication token - replace with actual login
let authToken = '';

/**
 * 1. School Admin Setup Flow
 */

// Step 1: Login as Admin (you'll need to implement this)
async function loginAsAdmin() {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login_id: 'admin@school.com', // Replace with actual admin credentials
                password: 'admin_password'
            })
        });
        
        const data = await response.json();
        if (data.access_token) {
            authToken = data.access_token;
            console.log('✅ Admin login successful');
            return data.access_token;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('❌ Admin login failed:', error);
        return null;
    }
}

// Step 2: Setup School Bank Details
async function setupSchoolBankDetails() {
    console.log('\n📋 Setting up school bank details...');
    
    const bankDetails = {
        bank_name: "State Bank of India",
        account_number: "1234567890123456",
        account_holder_name: "ABC International School Trust",
        ifsc_code: "SBIN0001234",
        branch_name: "Education City Branch",
        account_type: "current",
        upi_id: "school@paytm",
        payment_gateway_credentials: {
            razorpay: {
                key_id: "rzp_test_1234567890",
                key_secret: "your_razorpay_secret",
                webhook_secret: "your_webhook_secret",
                enabled: true
            },
            payu: {
                merchant_key: "your_payu_key",
                merchant_salt: "your_payu_salt",
                enabled: false
            },
            cashfree: {
                app_id: "your_cashfree_app_id",
                secret_key: "your_cashfree_secret",
                enabled: false
            }
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}/payment/school-bank-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(bankDetails)
        });
        
        const data = await response.json();
        console.log('✅ Bank details setup:', data.success ? 'Success' : 'Failed');
        return data;
    } catch (error) {
        console.error('❌ Bank details setup failed:', error);
    }
}

// Step 3: Create Fee Categories
async function createFeeCategories() {
    console.log('\n📚 Creating fee categories...');
    
    const categories = [
        {
            name: "Tuition Fee",
            description: "Monthly tuition fee for academic courses",
            is_mandatory: true,
            late_fee_applicable: true,
            late_fee_amount: 50
        },
        {
            name: "Transportation Fee",
            description: "Monthly school bus transportation fee",
            is_mandatory: false,
            late_fee_applicable: true,
            late_fee_amount: 25
        },
        {
            name: "Activity Fee",
            description: "Extra-curricular activities and sports fee",
            is_mandatory: false,
            late_fee_applicable: false,
            late_fee_amount: 0
        },
        {
            name: "Exam Fee",
            description: "Semester examination and assessment fee",
            is_mandatory: true,
            late_fee_applicable: true,
            late_fee_amount: 100
        }
    ];
    
    const createdCategories = [];
    
    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE}/payment/fee-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(category)
            });
            
            const data = await response.json();
            if (data.success) {
                createdCategories.push(data.data);
                console.log(`✅ Created category: ${category.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to create category: ${category.name}`, error);
        }
    }
    
    return createdCategories;
}

// Step 4: Create Fee Templates
async function createFeeTemplates(categories) {
    console.log('\n📋 Creating fee templates...');
    
    // Assuming we have category IDs from the previous step
    const templates = [
        {
            name: "Grade 10 Monthly Fee Template",
            description: "Monthly fee structure for Grade 10 students",
            class_id: "class_grade_10", // Replace with actual class ID
            academic_year: "2023-24",
            is_active: true,
            items: [
                {
                    category_id: categories[0]?.id || "tuition_category_id",
                    amount: 5000,
                    due_date: "2023-12-05T00:00:00Z",
                    is_mandatory: true,
                    late_fee_applicable: true
                },
                {
                    category_id: categories[1]?.id || "transport_category_id",
                    amount: 1500,
                    due_date: "2023-12-05T00:00:00Z",
                    is_mandatory: false,
                    late_fee_applicable: true
                }
            ],
            total_amount: 6500,
            installments_allowed: true,
            installment_config: {
                max_installments: 3,
                min_amount_per_installment: 2000
            }
        }
    ];
    
    const createdTemplates = [];
    
    for (const template of templates) {
        try {
            const response = await fetch(`${API_BASE}/payment/fee-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(template)
            });
            
            const data = await response.json();
            if (data.success) {
                createdTemplates.push(data.data);
                console.log(`✅ Created template: ${template.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to create template: ${template.name}`, error);
        }
    }
    
    return createdTemplates;
}

// Step 5: Generate Fees for Students
async function generateFeesForStudents(template) {
    console.log('\n💰 Generating fees for students...');
    
    const generateRequest = {
        template_id: template.id,
        academic_year: "2023-24",
        apply_discounts: true,
        installments_allowed: true
    };
    
    try {
        const response = await fetch(`${API_BASE}/payment/generate-fees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(generateRequest)
        });
        
        const data = await response.json();
        console.log('✅ Fee generation:', data.success ? 'Success' : 'Failed');
        if (data.success) {
            console.log(`   Generated fees for ${data.data?.generated_count || 0} students`);
        }
        return data;
    } catch (error) {
        console.error('❌ Fee generation failed:', error);
    }
}

/**
 * 2. Student/Parent Flow
 */

// Step 6: Login as Student/Parent (you'll need to implement this)
async function loginAsStudent() {
    console.log('\n👨‍🎓 Logging in as student...');
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login_id: 'student@school.com', // Replace with actual student credentials
                password: 'student_password'
            })
        });
        
        const data = await response.json();
        if (data.access_token) {
            authToken = data.access_token;
            console.log('✅ Student login successful');
            return data.access_token;
        }
    } catch (error) {
        console.error('❌ Student login failed:', error);
    }
    return null;
}

// Step 7: View Student Fees
async function viewStudentFees() {
    console.log('\n📊 Viewing student fees...');
    
    try {
        const response = await fetch(`${API_BASE}/payment/student-fees`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Student fees retrieved successfully');
            console.log(`   Pending fees: ${data.data.pending_fees?.length || 0}`);
            console.log(`   Paid fees: ${data.data.paid_fees?.length || 0}`);
            console.log(`   Total pending amount: ₹${data.data.summary?.total_pending || 0}`);
        }
        return data;
    } catch (error) {
        console.error('❌ Failed to get student fees:', error);
    }
}

// Step 8: Get Available Payment Gateways
async function getAvailableGateways() {
    console.log('\n💳 Getting available payment gateways...');
    
    try {
        const response = await fetch(`${API_BASE}/payment/available-gateways`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Available gateways retrieved');
            data.data.gateways?.forEach(gateway => {
                console.log(`   - ${gateway.name}: ${gateway.description}`);
            });
        }
        return data;
    } catch (error) {
        console.error('❌ Failed to get available gateways:', error);
    }
}

// Step 9: Initiate Payment
async function initiatePayment(feeId) {
    console.log('\n💰 Initiating payment...');
    
    const paymentRequest = {
        fee_id: feeId || "sample_fee_id",
        gateway: "razorpay",
        amount: 5000,
        callback_url: `${API_BASE}/payment/verify-payment/`,
        cancel_url: `${API_BASE}/payment/cancel`
    };
    
    try {
        const response = await fetch(`${API_BASE}/payment/initiate-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(paymentRequest)
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Payment initiated successfully');
            console.log(`   Transaction ID: ${data.data?.transaction_id}`);
            console.log(`   Payment URL: ${data.data?.payment_url}`);
        }
        return data;
    } catch (error) {
        console.error('❌ Payment initiation failed:', error);
    }
}

// Step 10: View Payment History
async function viewPaymentHistory() {
    console.log('\n📜 Viewing payment history...');
    
    try {
        const response = await fetch(`${API_BASE}/payment/payment-history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Payment history retrieved');
            console.log(`   Total transactions: ${data.data.transactions?.length || 0}`);
            console.log(`   Total invoices: ${data.data.invoices?.length || 0}`);
        }
        return data;
    } catch (error) {
        console.error('❌ Failed to get payment history:', error);
    }
}

/**
 * Main execution flow
 */
async function runPaymentSystemDemo() {
    console.log('🚀 Starting Payment System Demo...\n');
    
    // Admin Flow
    console.log('=== ADMIN SETUP FLOW ===');
    
    const adminToken = await loginAsAdmin();
    if (!adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
    }
    
    await setupSchoolBankDetails();
    const categories = await createFeeCategories();
    const templates = await createFeeTemplates(categories);
    
    if (templates.length > 0) {
        await generateFeesForStudents(templates[0]);
    }
    
    // Student Flow
    console.log('\n=== STUDENT/PARENT FLOW ===');
    
    const studentToken = await loginAsStudent();
    if (!studentToken) {
        console.log('❌ Cannot proceed without student authentication');
        return;
    }
    
    const studentFees = await viewStudentFees();
    await getAvailableGateways();
    
    // Simulate payment initiation if there are pending fees
    const pendingFees = studentFees?.data?.pending_fees;
    if (pendingFees && pendingFees.length > 0) {
        await initiatePayment(pendingFees[0].id);
    }
    
    await viewPaymentHistory();
    
    console.log('\n✅ Payment System Demo completed!');
    console.log('\n📋 Summary:');
    console.log('   - School bank details configured');
    console.log('   - Fee categories created');
    console.log('   - Fee templates configured');
    console.log('   - Student fees generated');
    console.log('   - Payment flow demonstrated');
    console.log('\n🎉 Your SaaS payment system is ready to use!');
}

// Uncomment the line below to run the demo
// runPaymentSystemDemo().catch(console.error);

console.log('📖 Payment System API Test Script Loaded');
console.log('💡 Call runPaymentSystemDemo() to start the demonstration');

module.exports = {
    runPaymentSystemDemo,
    loginAsAdmin,
    loginAsStudent,
    setupSchoolBankDetails,
    createFeeCategories,
    createFeeTemplates,
    generateFeesForStudents,
    viewStudentFees,
    getAvailableGateways,
    initiatePayment,
    viewPaymentHistory
};
