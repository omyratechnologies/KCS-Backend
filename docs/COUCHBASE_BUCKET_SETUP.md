# Manual Couchbase Bucket Creation Guide

## Error: "bucket not found"

If you're seeing the error `{"success":false,"error":"Failed to get chat rooms: bucket not found"}`, it means the Couchbase bucket hasn't been created yet.

## Step-by-Step Manual Bucket Creation

### 1. Access Couchbase Web Console

Open your browser and navigate to:
```
http://65.0.98.183:8091
```
Or use the server's domain:
```
http://your-couchbase-server:8091
```

### 2. Login to Couchbase

Use your administrator credentials:
- **Username**: `Administrator` (or your admin username)
- **Password**: Your Couchbase admin password

### 3. Create New Bucket

1. Click on **"Buckets"** in the left sidebar
2. Click the **"ADD BUCKET"** button (top right)

### 4. Configure Bucket Settings

Fill in the following settings:

#### Basic Settings
- **Name**: `kcs_backend` (must match your `.env` file's `OTTOMAN_BUCKET_NAME`)
- **Bucket Type**: `Couchbase` (default)
- **Memory Quota**: `512 MB` (or more based on your needs)

#### Advanced Settings
- **Replicas**: `0` (or `1` if you have multiple nodes)
- **Bucket Max Time-To-Live**: Leave blank (no TTL)
- **Compression Mode**: `Passive` (default)
- **Conflict Resolution**: `Sequence number` (default)
- **Ejection Method**: `Value-only` (default)
- **Enable flush**: ✅ **Checked** (useful for development)

### 5. Create the Bucket

1. Review all settings
2. Click **"Add Bucket"** button
3. Wait for the bucket to be created (usually takes a few seconds)

### 6. Verify Bucket Creation

After creation, you should see your bucket listed in the Buckets page with:
- Status: **Healthy** (green)
- Items: **0** (initially empty)
- RAM Used: **0 B / 512 MB**

### 7. Update Environment Configuration

Verify your `.env` file has the correct configuration:

```bash
# Couchbase/Ottoman Configuration
OTTOMAN_CONNECTION_STRING=couchbase://65.0.98.183
OTTOMAN_USERNAME=Administrator
OTTOMAN_PASSWORD=your_password_here
OTTOMAN_BUCKET_NAME=kcs_backend  # Must match the bucket name you created
```

### 8. Restart Application

After creating the bucket, restart your Node.js application:

```bash
# If using systemd
sudo systemctl restart kcs-backend

# If using PM2
pm2 restart kcs-backend

# If using Docker
docker-compose restart api
```

### 9. Verify Connection

Test if the bucket is accessible:

```bash
curl 'https://devapi.letscatchup-kcs.com/api/chat/rooms' \
  -H 'authorization: Bearer YOUR_TOKEN_HERE'
```

You should now get a successful response instead of "bucket not found".

---

## Common Issues

### Issue: "Insufficient RAM quota"
**Solution**: Reduce the bucket RAM quota or increase available RAM on the server

### Issue: "Bucket already exists"
**Solution**: The bucket is already created. Check if the bucket name in `.env` matches exactly

### Issue: "Authentication failed"
**Solution**: Verify your Couchbase admin credentials are correct

### Issue: Still getting "bucket not found" after creation
**Solutions**:
1. Verify the bucket name matches exactly (case-sensitive)
2. Restart the application to pick up the new bucket
3. Check the application logs for connection errors
4. Verify network connectivity between app and Couchbase

---

## Alternative: Using Couchbase CLI

If you prefer command-line, you can create the bucket using CLI:

```bash
# SSH into the server
ssh ubuntu@65.0.98.183

# Create bucket using couchbase-cli
/opt/couchbase/bin/couchbase-cli bucket-create \
  -c localhost:8091 \
  -u Administrator \
  -p YOUR_PASSWORD \
  --bucket kcs_backend \
  --bucket-type couchbase \
  --bucket-ramsize 512 \
  --bucket-replica 0 \
  --enable-flush 1 \
  --wait
```

---

## Alternative: Using the Setup Script

We've created an automated setup script:

```bash
# SSH into the server
ssh ubuntu@65.0.98.183

# Navigate to project directory
cd ~/KCS-Backend-1

# Run the setup script
COUCHBASE_PASSWORD=your_password ./scripts/setup-couchbase-bucket.sh
```

---

## After Bucket Creation

Once the bucket is created, Ottoman will automatically:
1. Connect to the bucket
2. Create necessary indexes
3. Initialize all models (Users, ChatRooms, ChatMessages, etc.)

The first startup after bucket creation might take slightly longer as it creates indexes.

---

## Need Help?

If you continue to experience issues:

1. Check Couchbase server logs:
   ```bash
   tail -f /opt/couchbase/var/lib/couchbase/logs/couchbase.log
   ```

2. Check application logs:
   ```bash
   sudo journalctl -u kcs-backend -f
   # or
   pm2 logs kcs-backend
   ```

3. Verify bucket status in Couchbase Web Console

4. Test basic connectivity:
   ```bash
   curl http://65.0.98.183:8091/pools/default/buckets/kcs_backend
   ```
