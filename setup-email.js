const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = new sqlite3.Database('./suggestions.db');

console.log('Mary Jean II Suggestion Box - Email Configuration Setup');
console.log('=======================================================\n');

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setupEmail() {
    console.log('This script will help you configure email settings for weekly reports.\n');
    
    console.log('First, you need to set up Gmail App Password:');
    console.log('1. Go to your Google Account settings');
    console.log('2. Enable 2-factor authentication');
    console.log('3. Generate an App Password for this application\n');
    
    const email = await askQuestion('Enter your Gmail address: ');
    const appPassword = await askQuestion('Enter your Gmail App Password (16 characters): ');
    
    const emailConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: email,
            pass: appPassword
        }
    };
    
    console.log('\nNow let\'s configure the crew email addresses:');
    console.log('Enter the email addresses for each crew member (press Enter to skip):\n');
    
    const captain = await askQuestion('Captain email: ');
    const chiefOfficer = await askQuestion('Chief Officer email: ');
    const chiefEngineer = await askQuestion('Chief Engineer email: ');
    const chiefStew = await askQuestion('Chief Stew email: ');
    const secondEngineer = await askQuestion('Second Engineer email: ');
    
    const crewEmails = [];
    if (captain) crewEmails.push(captain);
    if (chiefOfficer) crewEmails.push(chiefOfficer);
    if (chiefEngineer) crewEmails.push(chiefEngineer);
    if (chiefStew) crewEmails.push(chiefStew);
    if (secondEngineer) crewEmails.push(secondEngineer);
    
    // Update database
    db.serialize(() => {
        db.run(`UPDATE admin_config SET value = ? WHERE key = 'email_config'`, 
               [JSON.stringify(emailConfig)]);
        
        db.run(`UPDATE admin_config SET value = ? WHERE key = 'crew_emails'`, 
               [JSON.stringify(crewEmails)]);
        
        console.log('\n✅ Email configuration saved successfully!');
        console.log('\nConfiguration Summary:');
        console.log(`Gmail: ${email}`);
        console.log(`Crew emails: ${crewEmails.join(', ')}`);
        console.log('\nThe weekly reports will be sent every Monday at 9 AM.');
        console.log('You can test the email system from the admin panel.');
    });
    
    rl.close();
    db.close();
}

setupEmail().catch(console.error);
