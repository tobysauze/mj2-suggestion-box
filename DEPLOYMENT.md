# Mary Jean II Suggestion Box - Deployment Guide

## Quick Start

The Mary Jean II Suggestion Box is now ready to use! Here's how to get it running:

### 1. Access the Application

The application is currently running on: **http://localhost:3001**

### 2. Default Admin Access

- **Admin Password**: `maryjean2024`
- **Admin Panel**: Click the "Admin" button and enter the password

### 3. Configure Email Settings (Optional)

To enable weekly email reports to crew members:

```bash
npm run setup-email
```

This will guide you through setting up Gmail SMTP and crew email addresses.

## Features Overview

### For Users (Anyone with the URL)
- ✅ Submit anonymous suggestions
- ✅ Choose from predefined categories
- ✅ View all submitted suggestions
- ✅ Filter suggestions by category
- ✅ Character limit with live counter

### For Admins
- ✅ Secure password-protected access
- ✅ View all suggestions (including deleted ones)
- ✅ Delete inappropriate suggestions
- ✅ View statistics (total and weekly counts)
- ✅ Send weekly reports manually
- ✅ Export all suggestions to CSV
- ✅ Change admin password

### Automated Features
- ✅ Weekly email reports (every Monday at 9 AM)
- ✅ SQLite database for data persistence
- ✅ Input validation and security measures

## Production Deployment

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "mary-jean-suggestions"

# Save PM2 configuration
pm2 save

# Set up auto-start on boot
pm2 startup
```

### Option 2: Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t mary-jean-suggestions .
docker run -p 3000:3000 -d mary-jean-suggestions
```

### Option 3: Using a Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

### 1. Change Default Admin Password

```sql
UPDATE admin_config 
SET value = 'your-secure-password' 
WHERE key = 'admin_password';
```

### 2. Use HTTPS in Production

Set up SSL certificates and configure your reverse proxy to use HTTPS.

### 3. Database Backup

Regularly backup the `suggestions.db` file:

```bash
cp suggestions.db suggestions_backup_$(date +%Y%m%d).db
```

### 4. Environment Variables

For production, consider using environment variables:

```bash
export ADMIN_PASSWORD="your-secure-password"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export PORT=3000
```

## Monitoring and Maintenance

### 1. Check Application Status

```bash
# If using PM2
pm2 status
pm2 logs mary-jean-suggestions

# Check if server is responding
curl http://localhost:3001/api/suggestions
```

### 2. Database Maintenance

```bash
# Check database size
ls -lh suggestions.db

# Backup database
sqlite3 suggestions.db ".backup suggestions_backup.db"
```

### 3. Log Monitoring

The application logs important events to the console. For production, consider using a logging service or file-based logging.

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3001
   lsof -ti:3001
   # Kill the process
   kill -9 $(lsof -ti:3001)
   ```

2. **Email Not Sending**
   - Verify Gmail App Password is correct
   - Check that 2-factor authentication is enabled
   - Ensure SMTP settings are properly configured

3. **Database Issues**
   - Check file permissions on `suggestions.db`
   - Verify SQLite3 is installed
   - Check disk space

4. **Admin Login Issues**
   - Verify password in database
   - Check for typos in password
   - Ensure database is accessible

### Getting Help

1. Check the application logs
2. Run the test suite: `npm test`
3. Verify all dependencies are installed: `npm install`
4. Check database integrity: `sqlite3 suggestions.db "PRAGMA integrity_check;"`

## Customization

### Adding New Categories

Edit the category options in:
- `index.html` (form dropdown)
- `script.js` (filter dropdown)

### Changing Email Recipients

Update the crew emails in the database:

```sql
UPDATE admin_config 
SET value = '["new-email@example.com", "another@example.com"]' 
WHERE key = 'crew_emails';
```

### Modifying Email Schedule

Edit the cron schedule in `server.js`:

```javascript
// Every Monday at 9 AM (current)
cron.schedule('0 9 * * 1', () => { ... });

// Every Friday at 5 PM
cron.schedule('0 17 * * 5', () => { ... });
```

## Support

For technical support or feature requests, contact the system administrator or refer to the main README.md file.
