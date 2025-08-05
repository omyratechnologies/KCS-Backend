pipeline {
    agent any
    
    environment {
        // Git credentials
        GITHUB_TOKEN = credentials('github-access-token')
        
        // Docker registry (if using private registry)
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'omyratechnologies/kcs-backend'
        
        // Production server details
        PROD_SERVER = '13.204.105.220'
        SSH_KEY = credentials('ec2-ssh-key')
        
        // Microsoft Teams webhook URL
        TEAMS_WEBHOOK = credentials('teams-webhook-url')
        
        // Application environment variables
        NODE_ENV = 'production'
        
        // Build information
        BUILD_TIMESTAMP = sh(script: 'date +"%Y%m%d_%H%M%S"', returnStdout: true).trim()
        BUILD_TAG = "${env.BUILD_NUMBER}_${BUILD_TIMESTAMP}"
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }
    
    triggers {
        // Trigger build on SCM changes
        pollSCM('H/5 * * * *')
        
        // Webhook trigger from GitHub
        githubPush()
    }
    
    stages {
        stage('🔍 Checkout & Validate') {
            steps {
                script {
                    // Send Teams notification: Build started
                    try {
                        sendTeamsNotification([
                            status: 'STARTED',
                            title: '🚀 KCS Backend Build Started',
                            message: "Build #${env.BUILD_NUMBER} has started",
                            color: 'warning'
                        ])
                    } catch (Exception e) {
                        echo "⚠️ Teams notification failed: ${e.getMessage()}"
                    }
                }
                
                // Checkout code
                checkout scm
                
                // Validate environment
                sh '''
                    echo "🔍 Validating build environment..."
                    node --version
                    npm --version
                    docker --version
                    
                    echo "📦 Project structure:"
                    ls -la
                    
                    echo "🔧 Package.json validation:"
                    cat package.json | jq '.name, .version, .scripts'
                '''
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                sh '''
                    echo "📦 Installing dependencies with Bun..."
                    
                    # Install Bun if not available
                    if ! command -v bun &> /dev/null; then
                        curl -fsSL https://bun.sh/install | bash
                        export PATH="$HOME/.bun/bin:$PATH"
                        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
                    fi
                    
                    # Ensure Bun is in PATH
                    export PATH="$HOME/.bun/bin:$PATH"
                    
                    # Install dependencies
                    bun install --frozen-lockfile
                    
                    # Verify installation
                    echo "✅ Dependencies installed successfully"
                    echo "📦 Installed packages:"
                    ls node_modules | head -10
                    echo "Total packages: $(ls node_modules | wc -l)"
                '''
            }
        }
        
        stage('🧪 Test & Quality Checks') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh '''
                            echo "🧪 Running unit tests..."
                            
                            # Ensure Bun is in PATH
                            export PATH="$HOME/.bun/bin:$PATH"
                            
                            # Run tests
                            bun run test:coverage
                        '''
                    }
                    post {
                        always {
                            // Publish test results using junit
                            script {
                                if (fileExists('coverage/junit.xml')) {
                                    junit testResultsPattern: 'coverage/junit.xml'
                                }
                                if (fileExists('coverage/cobertura-coverage.xml')) {
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: 'coverage',
                                        reportFiles: 'index.html',
                                        reportName: 'Coverage Report'
                                    ])
                                }
                            }
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        sh '''
                            echo "🔍 Running code quality checks..."
                            
                            # Ensure Bun is in PATH
                            export PATH="$HOME/.bun/bin:$PATH"
                            
                            # Linting (CI mode with higher warning tolerance)
                            bun run lint:ci
                            
                            # Format check
                            bun run format:check
                            
                            # Type checking
                            bunx tsc --noEmit
                        '''
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh '''
                            echo "🛡️ Running security checks..."
                            
                            # Ensure Bun is in PATH
                            export PATH="$HOME/.bun/bin:$PATH"
                            
                            # Security scanning with Bun-compatible tools
                            echo "Checking for known vulnerabilities in dependencies..."
                            
                            # Security scanning with Bun-compatible tools
                            echo "Checking dependencies for known vulnerabilities..."
                            
                            # Try to create package-lock.json for npm audit (with fallback)
                            echo "Attempting to create temporary package-lock.json for vulnerability scanning..."
                            if npm install --package-lock-only --legacy-peer-deps 2>/dev/null; then
                                echo "✅ package-lock.json created successfully"
                                # Run audit with bun if available
                                if bunx audit-ci --moderate 2>/dev/null; then
                                    echo "✅ Audit completed successfully"
                                else
                                    echo "⚠️ Audit completed with warnings"
                                fi
                                rm package-lock.json
                            else
                                echo "⚠️ Could not create package-lock.json due to dependency conflicts"
                                echo "Using alternative Bun-based security checks..."
                            fi
                            
                            # Alternative security checks using Bun
                            echo "Checking for outdated packages that might have vulnerabilities..."
                            bun outdated || echo "Package check completed"
                            
                            # Check for sensitive files and patterns
                            echo "Scanning for potential security issues..."
                            grep -r "password\\|secret\\|key\\|token" --include="*.ts" --include="*.js" src/ | grep -v "password_resets\\|api_key.*string\\|secret.*string" || echo "No obvious secrets found"
                            
                            # Check for common security anti-patterns
                            echo "Checking for security anti-patterns..."
                            grep -r "eval\\|innerHTML\\|document.write" --include="*.ts" --include="*.js" src/ || echo "No dangerous patterns found"
                        '''
                    }
                }
            }
        }
        
        stage('🏗️ Build Application') {
            steps {
                sh '''
                    echo "🏗️ Building KCS Backend application..."
                    
                    # Ensure Bun is in PATH
                    export PATH="$HOME/.bun/bin:$PATH"
                    
                    # Build the application
                    bun run build
                    
                    # Verify build output
                    ls -la dist/
                    
                    echo "✅ Application built successfully"
                '''
            }
        }
        
        stage('🐳 Docker Build & Push') {
            steps {
                script {
                    // Build Docker image
                    def imageTag = "${DOCKER_REPO}:${BUILD_TAG}"
                    def latestTag = "${DOCKER_REPO}:latest"
                    
                    sh """
                        echo "🐳 Building Docker image..."
                        
                        # Build with BuildKit for optimization
                        export DOCKER_BUILDKIT=1
                        
                        # Build the image
                        docker build \\
                            --build-arg BUILD_NUMBER=${env.BUILD_NUMBER} \\
                            --build-arg BUILD_TIMESTAMP=${BUILD_TIMESTAMP} \\
                            --build-arg GIT_COMMIT=${env.GIT_COMMIT} \\
                            -t ${imageTag} \\
                            -t ${latestTag} \\
                            .
                        
                        echo "✅ Docker image built: ${imageTag}"
                    """
                    
                    // Push to registry (if configured)
                    if (env.DOCKER_REGISTRY_CREDENTIALS) {
                        withCredentials([usernamePassword(
                            credentialsId: 'docker-registry-credentials',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )]) {
                            sh """
                                echo "🚀 Pushing Docker image to registry..."
                                echo \$DOCKER_PASS | docker login ${DOCKER_REGISTRY} -u \$DOCKER_USER --password-stdin
                                docker push ${imageTag}
                                docker push ${latestTag}
                                echo "✅ Image pushed successfully"
                            """
                        }
                    }
                }
            }
        }
        
        stage('🚀 Deploy to Production') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    // Deploy to production server
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY_FILE',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        sh """
                            echo "🚀 Deploying to production server..."
                            
                            # Copy deployment files to server
                            scp -i \$SSH_KEY_FILE -o StrictHostKeyChecking=no \\
                                docker-compose.yaml \\
                                nginx.conf \\
                                .env.production \\
                                \$SSH_USER@${PROD_SERVER}:/opt/kcs-backend/
                            
                            # Execute deployment commands on server
                            ssh -i \$SSH_KEY_FILE -o StrictHostKeyChecking=no \$SSH_USER@${PROD_SERVER} << 'EOF'
                                cd /opt/kcs-backend
                                
                                # Update environment
                                cp .env.production .env
                                
                                # Pull latest image and restart services
                                docker-compose pull
                                docker-compose down
                                docker-compose up -d
                                
                                # Wait for services to be healthy
                                sleep 30
                                
                                # Health check
                                curl -f http://localhost:4500/api/health || exit 1
                                
                                echo "✅ Deployment completed successfully"
EOF
                            
                            echo "✅ Production deployment completed"
                        """
                    }
                }
            }
        }
        
        stage('🧪 Post-Deployment Tests') {
            when {
                branch 'dev'
            }
            steps {
                sh """
                    echo "🧪 Running post-deployment health checks..."
                    
                    # Wait for application to be ready
                    sleep 10
                    
                    # Health check
                    curl -f https://devapi.letscatchup-kcs.com/api/health
                    
                    # API endpoint tests
                    curl -f https://devapi.letscatchup-kcs.com/api/auth/health
                    
                    # WebSocket connection test
                    curl -f https://devapi.letscatchup-kcs.com/socket.io/
                    
                    echo "✅ All health checks passed"
                """
            }
        }
    }
    
    post {
        success {
            script {
                try {
                    sendTeamsNotification([
                        status: 'SUCCESS',
                        title: '✅ KCS Backend Build Successful',
                        message: """
                            **Build #${env.BUILD_NUMBER} completed successfully!**
                            
                            **Details:**
                            - Branch: ${env.BRANCH_NAME}
                            - Commit: ${env.GIT_COMMIT?.take(7)}
                            - Duration: ${currentBuild.durationString}
                            - Deployed to: Production
                            
                            **Links:**
                            - [Application](https://devapi.letscatchup-kcs.com)
                            - [Build Logs](${env.BUILD_URL})
                        """,
                        color: 'good'
                    ])
                } catch (Exception e) {
                    echo "⚠️ Teams notification failed: ${e.getMessage()}"
                }
            }
        }
        
        failure {
            script {
                try {
                    sendTeamsNotification([
                        status: 'FAILURE',
                        title: '❌ KCS Backend Build Failed',
                        message: """
                            **Build #${env.BUILD_NUMBER} failed!**
                            
                            **Details:**
                            - Branch: ${env.BRANCH_NAME}
                            - Commit: ${env.GIT_COMMIT?.take(7)}
                            - Duration: ${currentBuild.durationString}
                            - Stage: ${env.STAGE_NAME}
                            
                            **Action Required:**
                            Please check the build logs and fix the issues.
                            
                            **Links:**
                            - [Build Logs](${env.BUILD_URL})
                            - [Console Output](${env.BUILD_URL}console)
                        """,
                        color: 'danger'
                    ])
                } catch (Exception e) {
                    echo "⚠️ Teams notification failed: ${e.getMessage()}"
                }
            }
        }
        
        unstable {
            script {
                try {
                    sendTeamsNotification([
                        status: 'UNSTABLE',
                        title: '⚠️ KCS Backend Build Unstable',
                        message: """
                            **Build #${env.BUILD_NUMBER} is unstable**
                            
                            Some tests failed but build completed.
                            
                            **Links:**
                            - [Build Logs](${env.BUILD_URL})
                            - [Test Results](${env.BUILD_URL}testReport/)
                        """,
                        color: 'warning'
                    ])
                } catch (Exception e) {
                    echo "⚠️ Teams notification failed: ${e.getMessage()}"
                }
            }
        }
        
        always {
            script {
                try {
                    // Archive artifacts if they exist
                    if (fileExists('dist')) {
                        archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
                    }
                } catch (Exception e) {
                    echo "Could not archive artifacts: ${e.getMessage()}"
                }
                
                // Clean workspace
                cleanWs()
            }
        }
    }
}

// Helper function to send Teams notifications
def sendTeamsNotification(Map config) {
    def webhook = env.TEAMS_WEBHOOK
    if (!webhook) {
        echo "Teams webhook not configured, skipping notification"
        return
    }
    
    try {
        // Create Office 365 connector payload (Jenkins connector format)
        def payload = [
            "summary": config.title,
            "text": config.message,
            "themeColor": getThemeColor(config.color),
            "sections": [
                [
                    "activityTitle": config.title,
                    "activitySubtitle": "KCS Backend CI/CD Pipeline",
                    "activityImage": "https://jenkins.io/images/logos/jenkins/jenkins.png",
                    "facts": [
                        ["name": "Project", "value": "KCS Backend"],
                        ["name": "Build", "value": "#${env.BUILD_NUMBER}"],
                        ["name": "Branch", "value": "${env.BRANCH_NAME ?: 'dev'}"],
                        ["name": "Status", "value": config.status],
                        ["name": "Duration", "value": "${currentBuild.durationString ?: 'N/A'}"],
                        ["name": "Timestamp", "value": "${new Date().format('yyyy-MM-dd HH:mm:ss')}"]
                    ],
                    "markdown": true
                ]
            ],
            "potentialAction": [
                [
                    "@type": "OpenUri",
                    "name": "View Build",
                    "targets": [
                        ["os": "default", "uri": "${env.BUILD_URL}"]
                    ]
                ],
                [
                    "@type": "OpenUri",
                    "name": "Console Output", 
                    "targets": [
                        ["os": "default", "uri": "${env.BUILD_URL}console"]
                    ]
                ]
            ]
        ]
        
        // Convert to JSON and write to file
        def jsonPayload = groovy.json.JsonOutput.toJson(payload)
        writeFile file: 'teams-payload.json', text: jsonPayload
        
        echo "📤 Sending Teams notification: ${config.title}"
        echo "🔗 Build URL: ${env.BUILD_URL}"
        
        // Send with proper error handling
        withCredentials([string(credentialsId: 'teams-webhook-url', variable: 'WEBHOOK_URL')]) {
            def result = sh(
                script: '''
                    curl -X POST \\
                         -H "Content-Type: application/json" \\
                         -d @teams-payload.json \\
                         -w "HTTP_CODE:%{http_code}|SIZE:%{size_download}" \\
                         -s \\
                         "${WEBHOOK_URL}"
                ''',
                returnStdout: true
            ).trim()
            
            echo "📨 Teams API Response: ${result}"
            
            if (result.contains("HTTP_CODE:2")) {
                echo "✅ Teams notification sent successfully to KCS-Jenkins Workflow channel"
            } else {
                echo "⚠️ Teams notification failed - HTTP response: ${result}"
                echo "Please check the webhook URL and Teams channel configuration"
            }
        }
        
    } catch (Exception e) {
        echo "⚠️ Failed to send Teams notification: ${e.getMessage()}"
        echo "Stack trace: ${e.getStackTrace()}"
        echo "This is not critical - build can continue"
    }
}

def getThemeColor(color) {
    switch(color) {
        case 'good': return '00FF00'
        case 'warning': return 'FFA500'
        case 'danger': return 'FF0000'
        default: return '0078D4'
    }
}

def getAdaptiveCardColor(color) {
    switch(color) {
        case 'good': return 'Good'
        case 'warning': return 'Warning'
        case 'danger': return 'Attention'
        default: return 'Default'
    }
}
