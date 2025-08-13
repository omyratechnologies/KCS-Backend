pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        IMAGE_NAME = 'kcs-backend'
        COMPOSE_PROJECT_NAME = 'kcs'
        DEPLOY_HOST = '65.0.98.183'
        DEPLOY_USER = 'ubuntu'
        SSH_KEY = credentials('kcs-deploy-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.BUILD_NUMBER = BUILD_NUMBER
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "${env.GIT_COMMIT_SHORT}-${env.BUILD_NUMBER}"
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image with tag: ${env.IMAGE_TAG}"
                    sh """
                        docker compose build
                        docker tag kcs-api:latest ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                        docker tag kcs-api:latest ${env.IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Deploy to DEV') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Deploying to DEV environment..."
                    
                    // Create deployment script
                    writeFile file: 'deploy.sh', text: """#!/bin/bash
set -e

echo "Starting deployment..."

# Stop existing containers
docker compose down || true

# Remove old images (keep latest 3)
docker image prune -f
docker images ${env.IMAGE_NAME} --format "table {{.Tag}}" | tail -n +2 | sort -V | head -n -3 | xargs -r docker rmi ${env.IMAGE_NAME}: || true

# Pull latest code
git pull origin main

# Build and start services
docker compose build --no-cache
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
timeout 60 docker compose exec api curl -f http://localhost:4500/api/health || {
    echo "Health check failed, showing logs:"
    docker compose logs api
    exit 1
}

echo "Deployment completed successfully!"
docker compose ps
"""
                    
                    // Copy and execute deployment script
                    sh """
                        chmod +x deploy.sh
                        scp -i ${env.SSH_KEY} -o StrictHostKeyChecking=no deploy.sh ${env.DEPLOY_USER}@${env.DEPLOY_HOST}:~/
                        ssh -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.DEPLOY_USER}@${env.DEPLOY_HOST} '
                            cd ~/KCS-Backend && 
                            chmod +x ~/deploy.sh && 
                            ~/deploy.sh
                        '
                    """
                }
            }
        }
        
        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Performing health check..."
                    sh """
                        ssh -i ${env.SSH_KEY} -o StrictHostKeyChecking=no ${env.DEPLOY_USER}@${env.DEPLOY_HOST} '
                            curl -f http://localhost/api/health && echo "Health check passed"
                        '
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline completed successfully!"
            // You can add Slack/email notifications here
        }
        failure {
            echo "Pipeline failed!"
            // You can add failure notifications here
        }
    }
}
