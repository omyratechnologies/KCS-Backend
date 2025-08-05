# 🚀 Manual CI/CD Setup Guide for Fresh EC2 Instance

## Server Details
- **IP Address**: 13.204.105.220
- **SSH Key**: kcs-dev.pem
- **Teams Webhook**: Configured ✅

## Step 1: Connect to Your Server

```bash
# Make sure your SSH key has correct permissions
chmod 400 ~/Downloads/kcs-dev.pem

# Connect to your server
ssh -i ~/Downloads/kcs-dev.pem ubuntu@13.204.105.220
```

**If connection fails, check:**
1. Security Group allows SSH (port 22) from your IP
2. Instance is in "running" state
3. SSH key is correct

## Step 2: Install Jenkins and Dependencies

Once connected to your server, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip jq build-essential

# Install Java 17 (required for Jenkins)
sudo apt install -y openjdk-17-jdk
java -version

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update and install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check Jenkins status
sudo systemctl status jenkins
```

## Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add users to docker group
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

## Step 4: Install Node.js and Bun

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Add to bashrc for permanent PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Verify installations
node --version
npm --version
bun --version
```

## Step 5: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # Jenkins
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 4500/tcp  # KCS Backend API
sudo ufw allow 4501/tcp  # KCS Backend WebSocket

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

## Step 6: Create Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/kcs-backend
sudo chown ubuntu:ubuntu /opt/kcs-backend

# Create log directories
mkdir -p /opt/kcs-backend/logs
mkdir -p /opt/kcs-backend/logs/nginx
```

## Step 7: Get Jenkins Initial Password

```bash
# Wait for Jenkins to fully start (may take 2-3 minutes)
sleep 180

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Save this password - you'll need it for Jenkins setup
```

## Step 8: Access Jenkins Web Interface

1. **Open in browser**: `http://13.204.105.220:8080`
2. **Use the admin password** from Step 7
3. **Install suggested plugins**
4. **Create admin user** (recommended)
5. **Save and continue**

## Step 9: Configure Jenkins Credentials

In Jenkins, go to **Manage Jenkins > Manage Credentials > Global > Add Credentials**

### Credential 1: GitHub Access Token
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN`
- **ID**: `github-access-token`
- **Description**: GitHub Access Token for KCS Backend

### Credential 2: EC2 SSH Key
- **Kind**: SSH Username with private key
- **Scope**: Global
- **ID**: `ec2-ssh-key`
- **Description**: EC2 SSH Key for Production Deployment
- **Username**: `ubuntu`
- **Private Key**: Copy and paste the content of your `kcs-dev.pem` file

### Credential 3: Teams Webhook URL
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: `https://default24d1b36297254281bb1a4a5ad10bc3.7a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9e08851778ad4c7495cc5b2dedb91529/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ua4DPx31fCtSd7cewcojadeVqxB4nW81jHVLU2RXt6Q`
- **ID**: `teams-webhook-url`
- **Description**: Microsoft Teams Webhook for CI/CD Notifications

## Step 10: Install Required Jenkins Plugins

Go to **Manage Jenkins > Manage Plugins > Available** and install:

- [x] Git Plugin
- [x] GitHub Plugin
- [x] Docker Pipeline Plugin
- [x] SSH Agent Plugin
- [x] Build Timeout Plugin
- [x] Timestamper Plugin
- [x] Pipeline Plugin
- [x] Blue Ocean (optional, for better UI)

## Step 11: Create Pipeline Job

1. **New Item** → **Pipeline**
2. **Name**: `KCS-Backend-CI-CD`
3. **Pipeline section**:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/omyratechnologies/KCS-Backend.git`
   - **Credentials**: Select your GitHub token
   - **Branch**: `*/main`
   - **Script Path**: `Jenkinsfile`
4. **Save**

## Step 12: Configure GitHub Webhook (Optional)

1. Go to your GitHub repository: `https://github.com/omyratechnologies/KCS-Backend`
2. **Settings > Webhooks > Add webhook**
3. **Payload URL**: `http://13.204.105.220:8080/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Push events, Pull requests
6. **Save**

## Step 13: Test Your Pipeline

1. **Go to your pipeline job** in Jenkins
2. **Click "Build Now"**
3. **Watch the build progress**
4. **Check Teams notifications**

## Step 14: Setup Production Environment

On your server, create the production environment file:

```bash
cd /opt/kcs-backend

# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=4500
SOCKET_PORT=4501

# Database Configuration (update with your actual values)
COUCHBASE_CONNECTION_STRING=couchbase://your-couchbase-host:11210
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password
COUCHBASE_BUCKET=kcs_backend_production

# Redis Configuration (update with your actual values)
REDIS_URI=rediss://your-redis-host:6380
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@letscatchup-kcs.com
FROM_NAME=KCS Learning Management System

# MediaSoup Configuration
MEDIASOUP_WORKERS=4
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=13.204.105.220

# Teams Webhook
TEAMS_WEBHOOK_URL=https://default24d1b36297254281bb1a4a5ad10bc3.7a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9e08851778ad4c7495cc5b2dedb91529/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ua4DPx31fCtSd7cewcojadeVqxB4nW81jHVLU2RXt6Q

# Add other environment variables as needed
EOF

# Set proper permissions
chmod 600 .env.production
```

## 🎉 Completion Checklist

- [ ] Connected to EC2 instance successfully
- [ ] Jenkins installed and running
- [ ] Docker and Docker Compose installed
- [ ] Node.js and Bun installed
- [ ] Firewall configured
- [ ] Jenkins accessible at http://13.204.105.220:8080
- [ ] Jenkins initial setup completed
- [ ] All three credentials added to Jenkins
- [ ] Required plugins installed
- [ ] Pipeline job created
- [ ] GitHub webhook configured (optional)
- [ ] Production environment file created
- [ ] First build triggered successfully
- [ ] Teams notifications working

## 🔧 Troubleshooting

### Can't connect to server
```bash
# Check instance status in AWS console
# Verify security group allows SSH from your IP
# Try connecting with verbose mode
ssh -v -i ~/Downloads/kcs-dev.pem ubuntu@13.204.105.220
```

### Jenkins not accessible
```bash
# Check Jenkins status
sudo systemctl status jenkins

# Check if port 8080 is listening
sudo netstat -tlnp | grep :8080

# Restart Jenkins if needed
sudo systemctl restart jenkins
```

### Teams notifications not working
```bash
# Test webhook manually
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}' \
  'your_webhook_url'
```

## 🚀 Next Steps

Once everything is set up:

1. **Push code changes** to trigger automatic builds
2. **Monitor builds** in Jenkins dashboard
3. **Check Teams notifications** for build status
4. **Set up SSL certificates** with Let's Encrypt
5. **Configure monitoring** and alerting
6. **Add more test cases** and quality gates

## 📞 Support

If you encounter any issues:
1. Check Jenkins console logs
2. Review server system logs: `sudo journalctl -u jenkins -f`
3. Verify firewall settings: `sudo ufw status`
4. Test network connectivity: `telnet 13.204.105.220 8080`

---

**🎊 Congratulations! You're setting up a complete CI/CD pipeline for your KCS Backend!**
