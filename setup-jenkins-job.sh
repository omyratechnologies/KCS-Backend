#!/bin/bash

# Jenkins Job Configuration Script
# This script sets up a Jenkins job for KCS Backend CI/CD

set -e

JENKINS_HOST="43.203.115.64"
JENKINS_PORT="8080"
JENKINS_USER="kcs-dev"
JENKINS_PASSWORD="kcs-dev-jenkins"
JOB_NAME="kcs-backend-deploy"

echo "🔧 Setting up Jenkins job for KCS Backend..."

# Create job configuration XML
cat > job-config.xml << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <actions/>
  <description>KCS Backend CI/CD Pipeline - Automated deployment to DEV environment</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.33.1">
          <spec></spec>
        </com.cloudbees.jenkins.GitHubPushTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.87">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@4.7.1">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/omyratechnologies/KCS-Backend.git</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF

echo "📡 Creating Jenkins job via API..."

# Create the job
curl -X POST \
  "http://${JENKINS_HOST}:${JENKINS_PORT}/createItem?name=${JOB_NAME}" \
  --user "${JENKINS_USER}:${JENKINS_PASSWORD}" \
  --header "Content-Type: application/xml" \
  --data-binary @job-config.xml

if [ $? -eq 0 ]; then
    echo "✅ Jenkins job '${JOB_NAME}' created successfully!"
    echo ""
    echo "🔗 Access your job at:"
    echo "   http://${JENKINS_HOST}:${JENKINS_PORT}/job/${JOB_NAME}/"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Add SSH key credential in Jenkins:"
    echo "      - Go to: Manage Jenkins > Manage Credentials"
    echo "      - Add SSH Username with private key"
    echo "      - ID: 'kcs-deploy-key'"
    echo "      - Username: 'ubuntu'"
    echo "      - Private Key: Contents of ~/.ssh/kcs-dev.pem"
    echo ""
    echo "   2. Trigger first build:"
    echo "      - Go to job page and click 'Build Now'"
    echo ""
    echo "   3. Set up GitHub webhook (optional):"
    echo "      - Repository Settings > Webhooks"
    echo "      - Payload URL: http://${JENKINS_HOST}:${JENKINS_PORT}/github-webhook/"
    echo "      - Content type: application/json"
    echo "      - Events: Just the push event"
else
    echo "❌ Failed to create Jenkins job"
    exit 1
fi

# Clean up
rm -f job-config.xml
