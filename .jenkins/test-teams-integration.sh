#!/bin/bash

# 🧪 Microsoft Teams Integration Test Script
# Tests the Teams webhook integration for Jenkins notifications

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

echo "🧪 Testing Microsoft Teams Integration for KCS Backend CI/CD"
echo "============================================================"

# Check if webhook URL is provided
if [ -z "$TEAMS_WEBHOOK_URL" ]; then
    echo "Please provide your Teams webhook URL:"
    echo "You can set it as environment variable: export TEAMS_WEBHOOK_URL='your_webhook_url'"
    echo ""
    echo "To get a Teams webhook URL:"
    echo "1. Go to your Teams channel"
    echo "2. Click on '...' (More options)"
    echo "3. Select 'Connectors'"
    echo "4. Find 'Incoming Webhook' and configure"
    echo "5. Copy the webhook URL"
    echo ""
    read -p "Enter Teams webhook URL: " TEAMS_WEBHOOK_URL
fi

if [ -z "$TEAMS_WEBHOOK_URL" ]; then
    error "Teams webhook URL is required"
    exit 1
fi

# Test 1: Build Started Notification
log "Test 1: Sending 'Build Started' notification..."

BUILD_STARTED_PAYLOAD=$(cat << EOF
{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "FFA500",
    "summary": "🚀 KCS Backend Build Started",
    "sections": [
        {
            "activityTitle": "🚀 KCS Backend Build Started",
            "activitySubtitle": "KCS Backend CI/CD Pipeline - TEST",
            "activityImage": "https://jenkins.io/images/logos/jenkins/jenkins.png",
            "facts": [
                {
                    "name": "Project",
                    "value": "KCS Backend"
                },
                {
                    "name": "Build",
                    "value": "#TEST-001"
                },
                {
                    "name": "Branch",
                    "value": "main"
                },
                {
                    "name": "Status",
                    "value": "STARTED"
                }
            ],
            "markdown": true,
            "text": "**Build #TEST-001 has started**\\n\\nThis is a test notification from your Jenkins CI/CD pipeline setup."
        }
    ],
    "potentialAction": [
        {
            "@type": "OpenUri",
            "name": "View Build",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://jenkins.example.com/job/kcs-backend/TEST-001/"
                }
            ]
        }
    ]
}
EOF
)

response1=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$BUILD_STARTED_PAYLOAD" \
    "$TEAMS_WEBHOOK_URL")

if [ "$response1" = "200" ]; then
    log "✅ Test 1 PASSED: Build started notification sent successfully"
else
    error "❌ Test 1 FAILED: HTTP status code $response1"
fi

sleep 3

# Test 2: Build Success Notification
log "Test 2: Sending 'Build Success' notification..."

BUILD_SUCCESS_PAYLOAD=$(cat << EOF
{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "00FF00",
    "summary": "✅ KCS Backend Build Successful",
    "sections": [
        {
            "activityTitle": "✅ KCS Backend Build Successful",
            "activitySubtitle": "KCS Backend CI/CD Pipeline - TEST",
            "activityImage": "https://jenkins.io/images/logos/jenkins/jenkins.png",
            "facts": [
                {
                    "name": "Project",
                    "value": "KCS Backend"
                },
                {
                    "name": "Build",
                    "value": "#TEST-001"
                },
                {
                    "name": "Branch",
                    "value": "main"
                },
                {
                    "name": "Status",
                    "value": "SUCCESS"
                },
                {
                    "name": "Duration",
                    "value": "5min 23sec"
                }
            ],
            "markdown": true,
            "text": "**Build #TEST-001 completed successfully!**\\n\\n**Details:**\\n- Branch: main\\n- Commit: abc1234\\n- Duration: 5min 23sec\\n- Deployed to: Production\\n\\n**Links:**\\n- [Application](https://devapi.letscatchup-kcs.com)\\n- [Build Logs](https://jenkins.example.com/job/kcs-backend/TEST-001/)"
        }
    ],
    "potentialAction": [
        {
            "@type": "OpenUri",
            "name": "View Application",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://devapi.letscatchup-kcs.com"
                }
            ]
        },
        {
            "@type": "OpenUri",
            "name": "View Build Logs",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://jenkins.example.com/job/kcs-backend/TEST-001/"
                }
            ]
        }
    ]
}
EOF
)

response2=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$BUILD_SUCCESS_PAYLOAD" \
    "$TEAMS_WEBHOOK_URL")

if [ "$response2" = "200" ]; then
    log "✅ Test 2 PASSED: Build success notification sent successfully"
else
    error "❌ Test 2 FAILED: HTTP status code $response2"
fi

sleep 3

# Test 3: Build Failure Notification
log "Test 3: Sending 'Build Failure' notification..."

BUILD_FAILURE_PAYLOAD=$(cat << EOF
{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "FF0000",
    "summary": "❌ KCS Backend Build Failed",
    "sections": [
        {
            "activityTitle": "❌ KCS Backend Build Failed",
            "activitySubtitle": "KCS Backend CI/CD Pipeline - TEST",
            "activityImage": "https://jenkins.io/images/logos/jenkins/jenkins.png",
            "facts": [
                {
                    "name": "Project",
                    "value": "KCS Backend"
                },
                {
                    "name": "Build",
                    "value": "#TEST-002"
                },
                {
                    "name": "Branch",
                    "value": "main"
                },
                {
                    "name": "Status",
                    "value": "FAILURE"
                },
                {
                    "name": "Failed Stage",
                    "value": "Unit Tests"
                }
            ],
            "markdown": true,
            "text": "**Build #TEST-002 failed!**\\n\\n**Details:**\\n- Branch: main\\n- Commit: def5678\\n- Duration: 3min 45sec\\n- Stage: Unit Tests\\n\\n**Action Required:**\\nPlease check the build logs and fix the issues.\\n\\n**Links:**\\n- [Build Logs](https://jenkins.example.com/job/kcs-backend/TEST-002/)\\n- [Console Output](https://jenkins.example.com/job/kcs-backend/TEST-002/console)"
        }
    ],
    "potentialAction": [
        {
            "@type": "OpenUri",
            "name": "View Build Logs",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://jenkins.example.com/job/kcs-backend/TEST-002/"
                }
            ]
        }
    ]
}
EOF
)

response3=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$BUILD_FAILURE_PAYLOAD" \
    "$TEAMS_WEBHOOK_URL")

if [ "$response3" = "200" ]; then
    log "✅ Test 3 PASSED: Build failure notification sent successfully"
else
    error "❌ Test 3 FAILED: HTTP status code $response3"
fi

# Test Summary
echo ""
echo "🎯 Test Results Summary"
echo "======================="

total_tests=3
passed_tests=0

if [ "$response1" = "200" ]; then
    echo "✅ Build Started Notification: PASSED"
    ((passed_tests++))
else
    echo "❌ Build Started Notification: FAILED (HTTP $response1)"
fi

if [ "$response2" = "200" ]; then
    echo "✅ Build Success Notification: PASSED"
    ((passed_tests++))
else
    echo "❌ Build Success Notification: FAILED (HTTP $response2)"
fi

if [ "$response3" = "200" ]; then
    echo "✅ Build Failure Notification: PASSED"
    ((passed_tests++))
else
    echo "❌ Build Failure Notification: FAILED (HTTP $response3)"
fi

echo ""
echo "📊 Overall Result: $passed_tests/$total_tests tests passed"

if [ $passed_tests -eq $total_tests ]; then
    log "🎉 All tests passed! Teams integration is working correctly."
    echo ""
    info "💡 Next steps:"
    echo "1. Add this webhook URL to Jenkins credentials with ID 'teams-webhook-url'"
    echo "2. The Jenkinsfile is already configured to use this webhook"
    echo "3. Create your Jenkins pipeline job"
    echo "4. Push code to trigger actual builds with notifications"
    echo ""
    echo "📝 Jenkins Credential Configuration:"
    echo "   - Manage Jenkins > Manage Credentials"
    echo "   - Add Credential > Secret text"
    echo "   - ID: teams-webhook-url"
    echo "   - Secret: $TEAMS_WEBHOOK_URL"
else
    error "❌ Some tests failed. Please check your Teams webhook URL and try again."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Verify the webhook URL is correct"
    echo "2. Check if the Teams channel allows incoming webhooks"
    echo "3. Ensure you have permissions to post in the channel"
    echo "4. Try creating a new webhook connector"
fi

# Save webhook URL for future use
if [ $passed_tests -eq $total_tests ]; then
    echo "export TEAMS_WEBHOOK_URL='$TEAMS_WEBHOOK_URL'" > .teams-webhook-url
    log "💾 Webhook URL saved to .teams-webhook-url file"
fi

echo ""
log "🧪 Teams integration testing completed!"
