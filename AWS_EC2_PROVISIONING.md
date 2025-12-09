# AWS EC2 Provisioning Guide - Staging Server

## Step-by-Step AWS Console Instructions

### Step 1: Access AWS EC2 Console

1. Log in to **AWS Management Console**
2. Navigate to **EC2** (search "EC2" in the top search bar)
3. Ensure you're in your preferred region (top-right corner)
   - Recommended: Same region as production for consistency

---

### Step 2: Launch Instance

Click the **"Launch Instance"** button (orange button)

---

### Step 3: Configure Instance Details

#### Name and Tags
- **Name**: `p1lending-etl-staging`
- **Tags** (optional but recommended):
  - Key: `Environment` → Value: `staging`
  - Key: `Project` → Value: `P1Lending-ETL`
  - Key: `ManagedBy` → Value: `Ahmad`

#### Application and OS Images (AMI)
- **Quick Start**: Ubuntu
- **AMI**: **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- **Architecture**: 64-bit (x86)

#### Instance Type
- **Type**: `t3.large`
  - 2 vCPUs
  - 8 GiB RAM
  - Good network performance

**Alternative options:**
- Budget: `t3.medium` (2 vCPU, 4 GB RAM) - minimum
- Better performance: `t3.xlarge` (4 vCPU, 16 GB RAM)

#### Key Pair (Login)
- **Option A - Use Existing**: Select your existing key pair
- **Option B - Create New**:
  - Click **"Create new key pair"**
  - Name: `p1lending-etl-staging`
  - Type: RSA
  - Format: `.pem` (for SSH)
  - Click **"Create key pair"**
  - **IMPORTANT**: Save the `.pem` file securely
  - Set permissions: `chmod 400 p1lending-etl-staging.pem`

---

### Step 4: Network Settings

Click **"Edit"** next to Network Settings

#### VPC
- Use default VPC (or select your custom VPC if you have one)

#### Subnet
- **Auto-assign public IP**: **Enable** ✅

#### Firewall (Security Groups)
- **Create security group**: Yes
- **Security group name**: `p1lending-etl-staging-sg`
- **Description**: Security group for P1Lending ETL staging server

#### Security Group Rules

Add these rules:

**Rule 1 - SSH:**
- Type: SSH
- Protocol: TCP
- Port: 22
- Source: **My IP** (automatically detects your current IP)
- Description: SSH access

**Rule 2 - HTTP:**
- Type: HTTP
- Protocol: TCP
- Port: 80
- Source: Anywhere IPv4 (0.0.0.0/0)
- Description: HTTP access

**Rule 3 - HTTPS:**
- Type: HTTPS
- Protocol: TCP
- Port: 443
- Source: Anywhere IPv4 (0.0.0.0/0)
- Description: HTTPS access

**Rule 4 - Custom TCP (Backend API):**
- Type: Custom TCP
- Protocol: TCP
- Port: 8000
- Source: Anywhere IPv4 (0.0.0.0/0)
- Description: Backend API

**Rule 5 - Custom TCP (NTFY - Optional):**
- Type: Custom TCP
- Protocol: TCP
- Port: 7777
- Source: **My IP**
- Description: NTFY notifications (admin only)

---

### Step 5: Configure Storage

#### Root Volume
- **Size**: `50 GiB` (minimum recommended)
- **Volume type**: `gp3` (General Purpose SSD)
  - IOPS: 3000 (default)
  - Throughput: 125 MB/s (default)
- **Delete on termination**: ✅ Enabled
- **Encrypted**: Optional (✅ recommended for production, staging can skip)

**Why 50 GB?**
- OS & system: ~10 GB
- Docker images: ~5 GB
- Application: ~1 GB
- Logs: ~2 GB
- DNC database (if mounted): ~20-25 GB
- Buffer: ~10 GB

---

### Step 6: Advanced Details (Optional)

You can skip this section or configure:

#### IAM Instance Profile (Optional)
- Select if you need AWS service access (S3, etc.)
- For basic deployment: Leave blank

#### User Data (Optional)
If you want to automate initial setup, paste this script:

```bash
#!/bin/bash
# Initial setup automation
apt update
apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git curl
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker
```

---

### Step 7: Summary & Launch

1. Review the **Summary** panel on the right
2. Check configuration:
   - Instance type: t3.large
   - Storage: 50 GB gp3
   - Security groups: 5 rules configured
3. Click **"Launch Instance"**

---

### Step 8: Wait for Instance Launch

1. You'll see: "Successfully initiated launch of instance"
2. Click **"View all instances"**
3. Wait for:
   - **Instance State**: Running ✅
   - **Status Check**: 2/2 checks passed ✅
   - This takes 2-3 minutes

---

### Step 9: Note Instance Details

Once running, note these details:

1. **Instance ID**: `i-xxxxxxxxxxxxxxxxx`
2. **Public IPv4 address**: e.g., `54.123.45.67` ← **IMPORTANT**
3. **Public IPv4 DNS**: e.g., `ec2-54-123-45-67.compute-1.amazonaws.com`

**Write down the Public IPv4 address - you'll need it for:**
- SSH connection
- Cloudflare DNS configuration
- Nginx setup

---

### Step 10: Test SSH Connection

From your local machine:

```bash
# Replace with your key file and IP address
chmod 400 /path/to/p1lending-etl-staging.pem
ssh -i /path/to/p1lending-etl-staging.pem ubuntu@YOUR_PUBLIC_IP

# Example:
# ssh -i ~/Downloads/p1lending-etl-staging.pem ubuntu@54.123.45.67
```

**Expected output:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 6.2.0-1009-aws x86_64)
...
ubuntu@ip-172-31-x-x:~$
```

If connected successfully, you're ready to proceed!

---

## Quick Verification Checklist

After provisioning, verify:

- [ ] Instance state: **Running**
- [ ] Status checks: **2/2 passed**
- [ ] Public IP assigned: **Yes**
- [ ] SSH connection works: **Yes**
- [ ] Security group has 5 rules: **Yes**
- [ ] 50 GB storage attached: **Yes**

---

## Cost Estimate

**t3.large in us-east-1:**
- **Hourly**: ~$0.0832/hour
- **Daily**: ~$2.00/day
- **Monthly**: ~$60/month

**Storage (50 GB gp3):**
- ~$4/month

**Total estimated monthly cost: ~$64/month**

**To reduce costs:**
- Use t3.medium instead (~$30/month)
- Stop instance when not in use
- Use AWS Free Tier if eligible (750 hours/month for t2.micro/t3.micro)

---

## Troubleshooting

### Can't SSH to instance

**Check:**
1. Security group allows SSH (port 22) from your IP
2. Your IP hasn't changed (if using "My IP")
3. Key permissions: `chmod 400 your-key.pem`
4. Instance is running (not stopped/terminated)

**Fix security group:**
1. Go to EC2 → Instances
2. Select your instance
3. Click **Security** tab
4. Click security group name
5. **Inbound rules** → Edit
6. Update SSH rule to allow your current IP

### Instance won't start

1. Check AWS Service Health Dashboard
2. Try different availability zone
3. Check if you hit instance limits (AWS quota)

### Can't allocate Elastic IP (optional)

**If you want a static IP:**
1. EC2 → Elastic IPs
2. Allocate Elastic IP address
3. Associate with your instance
4. Update DNS with new static IP

---

## Next Steps After Provisioning

1. ✅ **Note your Public IP address**
2. ➡️ **Configure Cloudflare DNS** (add A record)
3. ➡️ **SSH to server** and run initial setup
4. ➡️ **Follow STAGING_SETUP.md** from Step 2 onward

---

## Instance Management Commands

### View instance details (AWS CLI - optional)

```bash
aws ec2 describe-instances --instance-ids i-YOUR_INSTANCE_ID
```

### Stop instance (to save costs when not in use)

**In AWS Console:**
1. Select instance
2. **Instance state** → Stop instance

**Via CLI:**
```bash
aws ec2 stop-instances --instance-ids i-YOUR_INSTANCE_ID
```

### Start instance again

**In AWS Console:**
1. Select instance
2. **Instance state** → Start instance

**Note:** Public IP will change unless you use Elastic IP

---

## Security Best Practices

After deployment:

1. **Update SSH rule** to use specific IP (not 0.0.0.0/0)
2. **Disable password authentication** in SSH
3. **Enable automatic security updates**:
   ```bash
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```
4. **Set up CloudWatch alarms** for monitoring
5. **Enable AWS Backup** for instance snapshots

---

**Ready to proceed?** Once your instance is running, share the **Public IP address** and we'll continue with DNS configuration!
