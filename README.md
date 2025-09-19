# Mary Jean II Suggestion Box

An anonymous suggestion box web application for the motor yacht Mary Jean II, allowing crew members and guests to submit suggestions that are reviewed by the management team.

## Features

- **Anonymous Suggestions**: Anyone with the URL can submit suggestions without revealing their identity
- **Categorized Suggestions**: Organize suggestions by category (Safety, Operations, Crew Welfare, etc.)
- **Admin Panel**: Secure admin access to manage and delete suggestions
- **Weekly Email Reports**: Automatic weekly reports sent to key crew members
- **Export Functionality**: Export all suggestions to CSV format
- **Responsive Design**: Works on desktop and mobile devices
- **Yacht-Themed UI**: Beautiful, professional design suitable for a luxury yacht

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Settings

The app uses Gmail SMTP for sending weekly reports. You'll need to:

1. Create a Gmail App Password:
   - Go to your Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for this application

2. Update the email configuration in the database:
   ```sql
   UPDATE admin_config 
   SET value = '{
     "host": "smtp.gmail.com",
     "port": 587,
     "secure": false,
     "auth": {
       "user": "your-email@gmail.com",
       "pass": "your-16-character-app-password"
     }
   }' 
   WHERE key = 'email_config';
   ```

3. Update crew email addresses:
   ```sql
   UPDATE admin_config 
   SET value = '[
     "captain@maryjeanii.com",
     "chief.officer@maryjeanii.com",
     "chief.engineer@maryjeanii.com",
     "chief.stew@maryjeanii.com",
     "second.engineer@maryjeanii.com"
   ]' 
   WHERE key = 'crew_emails';
   ```

### 3. Change Admin Password

For security, change the default admin password:

```sql
UPDATE admin_config 
SET value = 'your-secure-password' 
WHERE key = 'admin_password';
```

### 4. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### For Users
1. Navigate to the application URL
2. Enter your suggestion in the text area
3. Optionally select a category
4. Click "Submit Suggestion"
5. View all suggestions by clicking "View Suggestions"

### For Admins
1. Click "Admin" button
2. Enter the admin password
3. View statistics and manage suggestions
4. Delete inappropriate suggestions
5. Send weekly reports manually
6. Export suggestions to CSV

## Weekly Reports

The system automatically sends weekly reports every Monday at 9 AM to all configured crew email addresses. The reports include:
- All suggestions submitted in the past week
- Organized by date and category
- Professional HTML formatting

## Database Schema

The application uses SQLite with two main tables:

### suggestions
- `id`: Primary key
- `text`: Suggestion content
- `category`: Suggestion category
- `timestamp`: When submitted
- `status`: Current status (pending, reviewed, etc.)

### admin_config
- `key`: Configuration key
- `value`: Configuration value (JSON for complex data)

## Security Features

- Anonymous submissions (no user tracking)
- Admin password protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Customization

### Adding New Categories
Edit the category options in `index.html` and `script.js`

### Changing Email Recipients
Update the `crew_emails` configuration in the database

### Styling
Modify `styles.css` to match your yacht's branding

## Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "mary-jean-suggestions"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Email Not Sending
1. Verify Gmail App Password is correct
2. Check that 2-factor authentication is enabled
3. Ensure SMTP settings are correct
4. Check server logs for error messages

### Database Issues
- The database file `suggestions.db` is created automatically
- Backup this file regularly
- If corrupted, delete the file and restart the server

### Port Issues
- Default port is 3000
- Change the PORT environment variable if needed
- Ensure the port is not blocked by firewall

## Support

For technical support or feature requests, contact the system administrator.

## License

This application is proprietary software for Mary Jean II. All rights reserved.
