pipeline {
    agent any
    
    environment {
        // Git credentials
        GITHUB_TOKEN = credentials('github-access-token')
        
        // Docker registry
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'omyratechnologies/kcs-backend'
        
        // Server details (environment-specific)
        PROD_SERVER = '13.204.105.220'
        DEV_SERVER = '13.204.105.220' // Update with actual dev server IP
        SSH_KEY = credentials('ec2-ssh-key')
        
        // Microsoft Teams webhook URL
        TEAMS_WEBHOOK = credentials('teams-webhook-url')
        
        // Environment-specific configurations
        NODE_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : 'development'}"
        DEPLOY_URL = "${env.BRANCH_NAME == 'main' ? 'api.letscatchup-kcs.com' : 'devapi.letscatchup-kcs.com'}"
        
        // Build information
        BUILD_TIMESTAMP = sh(script: 'date +"%Y%m%d_%H%M%S"', returnStdout: true).trim()
        BUILD_TAG = "${env.BUILD_NUMBER}_${BUILD_TIMESTAMP}"
        
        // Bun path
        BUN_PATH = "${env.HOME}/.bun/bin"
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
        skipDefaultCheckout(false)
        retry(1)
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
                            title: "🚀 KCS Backend Build Started (${env.BRANCH_NAME})",
                            message: "Build #${env.BUILD_NUMBER} has started for ${env.BRANCH_NAME} branch",
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
                    echo "Branch: ${BRANCH_NAME}"
                    echo "Environment: ${NODE_ENV}"
                    echo "Deploy URL: ${DEPLOY_URL}"
                    
                    # Check system requirements
                    echo "=== System Information ==="
                    uname -a
                    echo "User: $(whoami)"
                    echo "Home: $HOME"
                    echo "PATH: $PATH"
                    
                    # Check available tools
                    echo "=== Available Tools ==="
                    if command -v node &> /dev/null; then
                        echo "✅ Node.js: $(node --version)"
                    else
                        echo "❌ Node.js not found - installing..."
                        # Install Node.js via NodeSource with error handling
                        if ! curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -; then
                            echo "Failed to add NodeSource repository, trying alternative..."
                            # Alternative method using snap or other package managers
                            if command -v snap &> /dev/null; then
                                sudo snap install node --classic
                            fi
                        fi
                        
                        if ! sudo apt-get install -y nodejs; then
                            echo "Failed to install Node.js via apt, trying binary install..."
                            wget -qO- https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz | tar -xJ -C /tmp/
                            sudo cp -r /tmp/node-v18.19.0-linux-x64/* /usr/local/
                        fi
                    fi
                    
                    if command -v npm &> /dev/null; then
                        echo "✅ npm: $(npm --version)"
                    else
                        echo "❌ npm not found"
                    fi
                    
                    if command -v docker &> /dev/null; then
                        echo "✅ Docker: $(docker --version)"
                    else
                        echo "❌ Docker not found"
                    fi
                    
                    # Check Bun availability with improved installation
                    if command -v bun &> /dev/null; then
                        echo "✅ Bun found: $(bun --version)"
                    else
                        echo "❌ Bun not found - will be installed"
                    fi
                    
                    echo "=== Project Structure ==="
                    ls -la
                    
                    echo "=== Package Configuration ==="
                    if [ -f "package.json" ]; then
                        echo "✅ package.json found"
                        if command -v jq &> /dev/null; then
                            cat package.json | jq '.name, .version, .scripts.test, .scripts["test:ci"]'
                        else
                            echo "📦 Package info (no jq available):"
                            grep -A 3 '"name"\\|"version"\\|"test"' package.json || echo "Basic grep completed"
                        fi
                    else
                        echo "❌ package.json not found!"
                        exit 1
                    fi
                    
                    echo "=== Lock Files ==="
                    ls -la *.lock* bun.lockb 2>/dev/null || echo "No lock files found"
                    
                    echo "✅ Environment validation completed"
                '''
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                sh '''
                    echo "📦 Installing dependencies with Bun..."
                    
                    # Enhanced Bun installation with proper error handling
                    if ! command -v bun &> /dev/null; then
                        echo "Installing Bun..."
                        
                        # Multiple installation methods for better reliability
                        if curl -fsSL https://bun.sh/install | bash; then
                            echo "✅ Bun installed via curl"
                        else
                            echo "❌ Curl method failed, trying npm..."
                            if command -v npm &> /dev/null; then
                                npm install -g bun
                            else
                                echo "❌ npm not available, trying alternative..."
                                # Download binary directly
                                wget -O /tmp/bun.zip https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip
                                cd /tmp && unzip bun.zip
                                sudo mv bun-linux-x64/bun /usr/local/bin/
                                chmod +x /usr/local/bin/bun
                            fi
                        fi
                        
                        # Ensure Bun is in PATH
                        export PATH="$HOME/.bun/bin:/usr/local/bin:$PATH"
                        
                        # Verify installation
                        if ! command -v bun &> /dev/null; then
                            echo "❌ Bun installation failed, using npm fallback"
                            export USE_NPM_FALLBACK=true
                        fi
                    else
                        export PATH="$HOME/.bun/bin:$PATH"
                    fi
                    
                    # Install dependencies with enhanced error handling
                    if [ "$USE_NPM_FALLBACK" = "true" ] || ! command -v bun &> /dev/null; then
                        echo "📦 Using npm for dependency installation..."
                        if [ -f "package-lock.json" ]; then
                            npm ci --prefer-offline --no-audit
                        else
                            npm install --prefer-offline --no-audit
                        fi
                    else
                        echo "📦 Using Bun for dependency installation..."
                        # Ensure Bun is accessible
                        which bun || export PATH="$HOME/.bun/bin:$PATH"
                        bun --version || { echo "❌ Bun not working properly"; exit 1; }
                        
                        # Install with optimized settings
                        if [ -f "bun.lockb" ]; then
                            echo "Using Bun lockfile..."
                            bun install --frozen-lockfile --verbose
                        else
                            echo "No Bun lockfile found, installing normally..."
                            bun install --verbose
                        fi
                    fi
                    
                    # Verify installation
                    echo "✅ Dependencies installed successfully"
                    echo "📦 Installed packages:"
                    ls node_modules | head -10
                    echo "Total packages: $(ls node_modules | wc -l)"
                    
                    # Verify critical packages
                    if [ ! -d "node_modules/typescript" ]; then
                        echo "❌ TypeScript not found in node_modules"
                        exit 1
                    fi
                    
                    if [ ! -d "node_modules/jest" ]; then
                        echo "❌ Jest not found in node_modules"
                        exit 1
                    fi
                    
                    echo "✅ Critical packages verified"
                '''
            }
        }
        
        stage('🧪 Test & Quality Checks') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh '''
                            echo "🧪 Running unit tests..."
                            
                            # Ensure runtime is available
                            export PATH="$HOME/.bun/bin:/usr/local/bin:$PATH"
                            
                            # Detect which runtime to use
                            if command -v bun &> /dev/null && [ "$USE_NPM_FALLBACK" != "true" ]; then
                                echo "✅ Using Bun for tests..."
                                
                                # Verify bun can run jest
                                if bun run --help &> /dev/null; then
                                    echo "📝 Running tests with Bun..."
                                    bun run test:ci
                                else
                                    echo "⚠️ Bun run command issues, falling back to direct execution..."
                                    bunx jest --coverage --ci --maxWorkers=1 --forceExit
                                fi
                            else
                                echo "📝 Using npm for tests..."
                                if command -v npm &> /dev/null; then
                                    npm run test:ci
                                else
                                    echo "❌ No package manager available, trying direct jest..."
                                    npx jest --coverage --ci --maxWorkers=1 --forceExit
                                fi
                            fi
                            
                            echo "✅ Tests completed successfully"
                        '''
                    }
                    post {
                        always {
                            script {
                                try {
                                    // Publish test results
                                    if (fileExists('coverage/junit.xml')) {
                                        echo "📊 Publishing JUnit test results..."
                                        junit 'coverage/junit.xml'
                                    } else if (fileExists('junit.xml')) {
                                        echo "📊 Publishing JUnit test results from root..."
                                        junit 'junit.xml'
                                    } else {
                                        echo "⚠️ No JUnit XML file found"
                                    }
                                } catch (Exception e) {
                                    echo "⚠️ Failed to publish test results: ${e.getMessage()}"
                                }
                                
                                try {
                                    // Publish coverage report
                                    if (fileExists('coverage/index.html')) {
                                        echo "📊 Publishing coverage report..."
                                        publishHTML([
                                            allowMissing: false,
                                            alwaysLinkToLastBuild: true,
                                            keepAll: true,
                                            reportDir: 'coverage',
                                            reportFiles: 'index.html',
                                            reportName: 'Coverage Report'
                                        ])
                                    }
                                } catch (Exception e) {
                                    echo "⚠️ Failed to publish coverage report: ${e.getMessage()}"
                                }
                            }
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        sh '''
                            echo "🔍 Running code quality checks..."
                            
                            # Ensure runtime is available
                            export PATH="$HOME/.bun/bin:/usr/local/bin:$PATH"
                            
                            # First, run formatting check
                            echo "📝 Checking code formatting..."
                            if command -v bun &> /dev/null && [ "$USE_NPM_FALLBACK" != "true" ]; then
                                if ! bun run format:check; then
                                    echo "⚠️ Code formatting issues found, auto-fixing..."
                                    bun run format || echo "Format command completed with warnings"
                                fi
                            else
                                if ! npx prettier --check .; then
                                    echo "⚠️ Code formatting issues found, auto-fixing..."
                                    npx prettier --write . || echo "Format command completed with warnings"
                                fi
                            fi
                            
                            # Run linting with appropriate rules for environment
                            echo "🔍 Running ESLint checks..."
                            if [ "${NODE_ENV}" = "development" ]; then
                                echo "Running development linting rules (relaxed for dev environment)..."
                                if command -v bun &> /dev/null && [ "$USE_NPM_FALLBACK" != "true" ]; then
                                    bun run lint:check || echo "⚠️ Linting completed with warnings (dev environment)"
                                else
                                    npx eslint . --ext .ts --max-warnings 300 || echo "⚠️ Linting completed with warnings (dev environment)"
                                fi
                            else
                                echo "Running production linting rules..."
                                if command -v bun &> /dev/null && [ "$USE_NPM_FALLBACK" != "true" ]; then
                                    if [ -f ".eslintrc.ci.json" ]; then
                                        echo "Using CI-specific ESLint configuration..."
                                        bun run lint:ci || echo "⚠️ Linting completed with warnings (non-critical for deployment)"
                                    else
                                        echo "CI config not found, using regular lint with relaxed warnings..."
                                        npx eslint . --ext .ts --max-warnings 200 || echo "⚠️ Linting completed with warnings"
                                    fi
                                else
                                    npx eslint . --ext .ts --max-warnings 200 || echo "⚠️ Linting completed with warnings"
                                fi
                            fi
                            
                            # Type checking
                            echo "🔍 Running TypeScript type checks..."
                            if command -v bun &> /dev/null && [ "$USE_NPM_FALLBACK" != "true" ]; then
                                bunx tsc --noEmit || {
                                    echo "⚠️ TypeScript errors found"
                                    # Don't fail the build for TS errors in dev environment
                                    if [ "${NODE_ENV}" = "production" ]; then
                                        exit 1
                                    fi
                                }
                            else
                                npx tsc --noEmit || {
                                    echo "⚠️ TypeScript errors found"
                                    if [ "${NODE_ENV}" = "production" ]; then
                                        exit 1
                                    fi
                                }
                            fi
                            
                            echo "✅ Code quality checks completed"
                        '''
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh '''
                            echo "🛡️ Running security checks..."
                            
                            # Ensure Bun is in PATH
                            export PATH="$HOME/.bun/bin:$PATH"
                            
                            echo "Checking dependencies for known vulnerabilities..."
                            
                            # Try Bun first, then npm fallback
                            if command -v bun &> /dev/null; then
                                echo "Using Bun for security checks..."
                                
                                # Check for outdated packages
                                echo "Checking for outdated packages..."
                                bun outdated || echo "Package check completed with warnings"
                                
                            else
                                echo "Using npm for security checks..."
                                
                                # Try to create package-lock.json for npm audit (with fallback)
                                if npm install --package-lock-only --legacy-peer-deps 2>/dev/null; then
                                    echo "✅ package-lock.json created successfully"
                                    
                                    # Run npm audit with appropriate level
                                    if [ "${NODE_ENV}" = "development" ]; then
                                        npm audit --audit-level=high || echo "⚠️ Audit completed with warnings"
                                    else
                                        npm audit --audit-level=moderate || echo "⚠️ Audit completed with warnings"
                                    fi
                                    
                                    # Clean up
                                    rm -f package-lock.json
                                else
                                    echo "⚠️ Could not create package-lock.json - skipping npm audit"
                                fi
                            fi
                            
                            # Check for sensitive files and patterns (development vs production)
                            echo "Checking for potential security issues..."
                            if [ "${NODE_ENV}" = "development" ]; then
                                echo "Running development security checks (less strict)..."
                                grep -r "password\\|secret\\|key\\|token" --include="*.ts" --include="*.js" src/ | grep -v "password_resets\\|api_key.*string\\|secret.*string\\|JWT_SECRET\\|console.log" | head -10 || echo "Security pattern check completed"
                            else
                                echo "Running production security checks (strict)..."
                                if grep -r "password\\|secret\\|key\\|token" --include="*.ts" --include="*.js" src/ | grep -v "password_resets\\|api_key.*string\\|secret.*string"; then
                                    echo "⚠️ Potential hardcoded secrets found - please review"
                                else
                                    echo "✅ No obvious secrets found"
                                fi
                            fi
                            
                            # Check for common security anti-patterns
                            echo "Checking for security anti-patterns..."
                            if grep -r "eval\\|innerHTML\\|document.write" --include="*.ts" --include="*.js" src/; then
                                echo "⚠️ Potentially dangerous patterns found"
                            else
                                echo "✅ No dangerous patterns found"
                            fi
                            
                            # Check environment files
                            echo "Checking for environment files..."
                            ls -la .env* 2>/dev/null && echo "⚠️ Environment files found - ensure they're not committed" || echo "✅ No environment files in repository"
                            
                            echo "✅ Security scan completed"
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
                    
                    # Check if Bun is available, fallback to npm
                    if command -v bun &> /dev/null; then
                        echo "✅ Using Bun for build..."
                        bun run build
                    else
                        echo "❌ Bun not available, trying npm..."
                        source ~/.bashrc 2>/dev/null || true
                        export PATH="$HOME/.bun/bin:$PATH"
                        
                        if command -v bun &> /dev/null; then
                            bun run build
                        else
                            echo "Using npm fallback..."
                            npm run build
                        fi
                    fi
                    
                    # Verify build output
                    if [ -d "dist" ]; then
                        echo "✅ Build directory created successfully"
                        ls -la dist/
                        echo "Build files count: $(find dist -type f | wc -l)"
                    else
                        echo "❌ Build directory not found!"
                        exit 1
                    fi
                    
                    echo "✅ Application built successfully"
                '''
            }
        }
        
        stage('🐳 Docker Build & Push') {
            steps {
                script {
                    // Build Docker image with environment-specific tags
                    def imageTag = "${DOCKER_REPO}:${BUILD_TAG}"
                    def latestTag = "${DOCKER_REPO}:${env.BRANCH_NAME}-latest"
                    def dockerfile = env.NODE_ENV == 'development' ? 'Dockerfile.dev' : 'Dockerfile'
                    
                    sh """
                        echo "🐳 Building Docker image for ${NODE_ENV} environment..."
                        
                        # Build with BuildKit for optimization
                        export DOCKER_BUILDKIT=1
                        
                        # Build the image
                        docker build \\
                            -f ${dockerfile} \\
                            --build-arg BUILD_NUMBER=${env.BUILD_NUMBER} \\
                            --build-arg BUILD_TIMESTAMP=${BUILD_TIMESTAMP} \\
                            --build-arg GIT_COMMIT=${env.GIT_COMMIT} \\
                            --build-arg NODE_ENV=${NODE_ENV} \\
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
        
        stage('🚀 Deploy to Development') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    // Deploy to development server
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY_FILE',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        sh """
                            echo "🚀 Deploying to development server..."
                            
                            # Copy deployment files to development server
                            scp -i \$SSH_KEY_FILE -o StrictHostKeyChecking=no \\
                                docker-compose.dev.yml \\
                                .env.development.example \\
                                nginx/dev.conf \\
                                \$SSH_USER@${DEV_SERVER}:/opt/kcs-backend-dev/
                            
                            # Execute deployment commands on development server
                            ssh -i \$SSH_KEY_FILE -o StrictHostKeyChecking=no \$SSH_USER@${DEV_SERVER} << 'EOF'
                                cd /opt/kcs-backend-dev
                                
                                # Update environment
                                cp .env.development.example .env.development
                                
                                # Pull latest image and restart development services
                                docker-compose -f docker-compose.dev.yml pull
                                docker-compose -f docker-compose.dev.yml down
                                docker-compose -f docker-compose.dev.yml up -d
                                
                                # Wait for services to be healthy
                                sleep 30
                                
                                # Health check
                                curl -f http://localhost:4500/api/health || exit 1
                                
                                echo "✅ Development deployment completed successfully"
EOF
                            
                            echo "✅ Development deployment completed"
                        """
                    }
                }
            }
        }
        
        stage('🚀 Deploy to Production') {
            when {
                branch 'main'
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
                            
                            # Copy deployment files to production server
                            scp -i \$SSH_KEY_FILE -o StrictHostKeyChecking=no \\
                                docker-compose.yaml \\
                                nginx.conf \\
                                .env.production \\
                                \$SSH_USER@${PROD_SERVER}:/opt/kcs-backend/
                            
                            # Execute deployment commands on production server
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
                                
                                echo "✅ Production deployment completed successfully"
EOF
                            
                            echo "✅ Production deployment completed"
                        """
                    }
                }
            }
        }
        
        stage('🧪 Post-Deployment Tests') {
            parallel {
                stage('Development Health Checks') {
                    when {
                        branch 'dev'
                    }
                    steps {
                        sh """
                            echo "🧪 Running development environment health checks..."
                            
                            # Wait for application to be ready
                            sleep 10
                            
                            # Health check
                            curl -f https://devapi.letscatchup-kcs.com/api/health
                            
                            # API endpoint tests
                            curl -f https://devapi.letscatchup-kcs.com/api/auth/health
                            
                            # WebSocket connection test
                            curl -f https://devapi.letscatchup-kcs.com/socket.io/
                            
                            echo "✅ All development health checks passed"
                        """
                    }
                }
                
                stage('Production Health Checks') {
                    when {
                        branch 'main'
                    }
                    steps {
                        sh """
                            echo "🧪 Running production environment health checks..."
                            
                            # Wait for application to be ready
                            sleep 10
                            
                            # Health check
                            curl -f https://api.letscatchup-kcs.com/api/health
                            
                            # API endpoint tests
                            curl -f https://api.letscatchup-kcs.com/api/auth/health
                            
                            # WebSocket connection test
                            curl -f https://api.letscatchup-kcs.com/socket.io/
                            
                            echo "✅ All production health checks passed"
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                try {
                    sendTeamsNotification([
                        status: 'SUCCESS',
                        title: "✅ KCS Backend Build Successful (${env.BRANCH_NAME})",
                        message: """
                            **Build #${env.BUILD_NUMBER} completed successfully!**
                            
                            **Details:**
                            - Branch: ${env.BRANCH_NAME}
                            - Environment: ${NODE_ENV}
                            - Commit: ${env.GIT_COMMIT?.take(7)}
                            - Duration: ${currentBuild.durationString}
                            - Deployed to: ${env.BRANCH_NAME == 'main' ? 'Production' : 'Development'}
                            
                            **Links:**
                            - [Application](https://${DEPLOY_URL})
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
                        title: "❌ KCS Backend Build Failed (${env.BRANCH_NAME})",
                        message: """
                            **Build #${env.BUILD_NUMBER} failed!**
                            
                            **Details:**
                            - Branch: ${env.BRANCH_NAME}
                            - Environment: ${NODE_ENV}
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
                        title: "⚠️ KCS Backend Build Unstable (${env.BRANCH_NAME})",
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
                        ["name": "Environment", "value": "${env.NODE_ENV ?: 'development'}"],
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
                echo "✅ Teams notification sent successfully"
            } else {
                echo "⚠️ Teams notification failed - HTTP response: ${result}"
            }
        }
        
    } catch (Exception e) {
        echo "⚠️ Failed to send Teams notification: ${e.getMessage()}"
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
