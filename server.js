const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./suggestions.db');

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        category TEXT DEFAULT 'other',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS admin_config (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);
    
    // Insert default admin password if not exists
    db.run(`INSERT OR IGNORE INTO admin_config (key, value) VALUES ('admin_password', 'maryjean2024')`);
    
    // Insert default email configuration if not exists
    db.run(`INSERT OR IGNORE INTO admin_config (key, value) VALUES ('email_config', '{
        "host": "smtp.gmail.com",
        "port": 587,
        "secure": false,
        "auth": {
            "user": "your-email@gmail.com",
            "pass": "your-app-password"
        }
    }')`);
    
    // Insert crew email addresses if not exists
    db.run(`INSERT OR IGNORE INTO admin_config (key, value) VALUES ('crew_emails', '[
        "captain@maryjeanii.com",
        "chief.officer@maryjeanii.com",
        "chief.engineer@maryjeanii.com",
        "chief.stew@maryjeanii.com",
        "second.engineer@maryjeanii.com"
    ]')`);
});

// Email configuration
let emailConfig = null;
let crewEmails = [];

// Load email configuration
function loadEmailConfig() {
    db.get("SELECT value FROM admin_config WHERE key = 'email_config'", (err, row) => {
        if (err) {
            console.error('Error loading email config:', err);
        } else if (row) {
            try {
                emailConfig = JSON.parse(row.value);
            } catch (e) {
                console.error('Error parsing email config:', e);
            }
        }
    });
    
    db.get("SELECT value FROM admin_config WHERE key = 'crew_emails'", (err, row) => {
        if (err) {
            console.error('Error loading crew emails:', err);
        } else if (row) {
            try {
                crewEmails = JSON.parse(row.value);
            } catch (e) {
                console.error('Error parsing crew emails:', e);
            }
        }
    });
}

loadEmailConfig();

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all suggestions
app.get('/api/suggestions', (req, res) => {
    const query = `
        SELECT id, text, category, timestamp, status 
        FROM suggestions 
        WHERE status = 'pending'
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching suggestions:', err);
            res.json({ success: false, error: 'Database error' });
        } else {
            res.json({ success: true, suggestions: rows });
        }
    });
});

// Submit new suggestion
app.post('/api/suggestions', (req, res) => {
    const { text, category } = req.body;
    
    if (!text || text.trim().length === 0) {
        return res.json({ success: false, error: 'Suggestion text is required' });
    }
    
    if (text.length > 1000) {
        return res.json({ success: false, error: 'Suggestion is too long' });
    }
    
    const query = `
        INSERT INTO suggestions (text, category, timestamp, status)
        VALUES (?, ?, datetime('now'), 'pending')
    `;
    
    db.run(query, [text.trim(), category || 'other'], function(err) {
        if (err) {
            console.error('Error inserting suggestion:', err);
            res.json({ success: false, error: 'Database error' });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    db.get("SELECT value FROM admin_config WHERE key = 'admin_password'", (err, row) => {
        if (err) {
            console.error('Error checking admin password:', err);
            res.json({ success: false, error: 'Database error' });
        } else if (row && row.value === password) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Invalid password' });
        }
    });
});

// Get admin suggestions (including all statuses)
app.get('/api/admin/suggestions', (req, res) => {
    const query = `
        SELECT id, text, category, timestamp, status 
        FROM suggestions 
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching admin suggestions:', err);
            res.json({ success: false, error: 'Database error' });
        } else {
            res.json({ success: true, suggestions: rows });
        }
    });
});

// Delete suggestion (admin only)
app.delete('/api/admin/suggestions/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM suggestions WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            console.error('Error deleting suggestion:', err);
            res.json({ success: false, error: 'Database error' });
        } else if (this.changes === 0) {
            res.json({ success: false, error: 'Suggestion not found' });
        } else {
            res.json({ success: true });
        }
    });
});

// Get admin statistics
app.get('/api/admin/stats', (req, res) => {
    const totalQuery = 'SELECT COUNT(*) as count FROM suggestions';
    const weeklyQuery = `
        SELECT COUNT(*) as count 
        FROM suggestions 
        WHERE timestamp >= datetime('now', '-7 days')
    `;
    
    db.get(totalQuery, [], (err, totalRow) => {
        if (err) {
            console.error('Error fetching total stats:', err);
            return res.json({ success: false, error: 'Database error' });
        }
        
        db.get(weeklyQuery, [], (err, weeklyRow) => {
            if (err) {
                console.error('Error fetching weekly stats:', err);
                return res.json({ success: false, error: 'Database error' });
            }
            
            res.json({
                success: true,
                stats: {
                    total: totalRow.count,
                    weekly: weeklyRow.count
                }
            });
        });
    });
});

// Send weekly report
app.post('/api/admin/send-weekly-report', (req, res) => {
    if (!emailConfig || !crewEmails.length) {
        return res.json({ success: false, error: 'Email configuration not set up' });
    }
    
    // Get suggestions from the last week
    const query = `
        SELECT text, category, timestamp 
        FROM suggestions 
        WHERE timestamp >= datetime('now', '-7 days')
        AND status = 'pending'
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [], (err, suggestions) => {
        if (err) {
            console.error('Error fetching weekly suggestions:', err);
            return res.json({ success: false, error: 'Database error' });
        }
        
        sendWeeklyReportEmail(suggestions)
            .then(() => {
                res.json({ success: true });
            })
            .catch((error) => {
                console.error('Error sending weekly report:', error);
                res.json({ success: false, error: 'Failed to send email' });
            });
    });
});

// Export suggestions as CSV
app.get('/api/admin/export', (req, res) => {
    const query = `
        SELECT text, category, timestamp, status 
        FROM suggestions 
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching suggestions for export:', err);
            res.json({ success: false, error: 'Database error' });
        } else {
            // Create CSV content
            let csv = 'Date,Category,Status,Suggestion\n';
            rows.forEach(row => {
                const date = new Date(row.timestamp).toLocaleDateString();
                const category = row.category.replace(/,/g, ';');
                const text = row.text.replace(/,/g, ';').replace(/\n/g, ' ');
                csv += `"${date}","${category}","${row.status}","${text}"\n`;
            });
            
            res.json({ success: true, csv });
        }
    });
});

// Email functions
function sendWeeklyReportEmail(suggestions) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransporter(emailConfig);
        
        const subject = `Mary Jean II - Weekly Suggestions Report (${new Date().toLocaleDateString()})`;
        
        let html = `
            <h2>Mary Jean II - Weekly Suggestions Report</h2>
            <p>Here are the suggestions submitted this week:</p>
            <hr>
        `;
        
        if (suggestions.length === 0) {
            html += '<p><em>No new suggestions this week.</em></p>';
        } else {
            suggestions.forEach((suggestion, index) => {
                const date = new Date(suggestion.timestamp).toLocaleDateString();
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #3498db; background-color: #f8f9fa;">
                        <h4>Suggestion #${index + 1} - ${date}</h4>
                        <p><strong>Category:</strong> ${suggestion.category.replace('_', ' ')}</p>
                        <p><strong>Suggestion:</strong></p>
                        <p style="background-color: white; padding: 10px; border-radius: 5px;">${suggestion.text}</p>
                    </div>
                `;
            });
        }
        
        html += `
            <hr>
            <p><em>This report was automatically generated by the Mary Jean II Suggestion Box system.</em></p>
            <p><em>To review and manage suggestions, please access the admin panel.</em></p>
        `;
        
        const mailOptions = {
            from: emailConfig.auth.user,
            to: crewEmails.join(', '),
            subject: subject,
            html: html
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                console.log('Weekly report sent:', info.messageId);
                resolve(info);
            }
        });
    });
}

// Schedule weekly email reports (every Monday at 9 AM)
cron.schedule('0 9 * * 1', () => {
    console.log('Running scheduled weekly report...');
    
    const query = `
        SELECT text, category, timestamp 
        FROM suggestions 
        WHERE timestamp >= datetime('now', '-7 days')
        AND status = 'pending'
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [], (err, suggestions) => {
        if (err) {
            console.error('Error fetching suggestions for scheduled report:', err);
            return;
        }
        
        sendWeeklyReportEmail(suggestions)
            .then(() => {
                console.log('Scheduled weekly report sent successfully');
            })
            .catch((error) => {
                console.error('Error sending scheduled weekly report:', error);
            });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Mary Jean II Suggestion Box server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
    console.log('Admin password: maryjean2024');
    console.log('Remember to configure email settings in the database for weekly reports');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
