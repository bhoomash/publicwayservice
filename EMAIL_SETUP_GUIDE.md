# Email Configuration Setup Guide

## Gmail SMTP Setup

To enable email sending for OTP verification, follow these steps:

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the instructions to enable 2-Step Verification

### Step 2: Generate App Password

1. After enabling 2-Step Verification, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Enter "Government Portal" as the device name
5. Click "Generate" - this will give you a 16-character password

### Step 3: Update .env File

1. Open `server/.env` file
2. Replace the email configuration with your details:
   ```
   SMTP_USERNAME=your-actual-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=your-actual-email@gmail.com
   ```

### Step 4: Restart the Server

After updating the .env file, restart your backend server:

```bash
cd server
python -m app.main
```

## Alternative Email Providers

### Outlook/Hotmail

```
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo Mail

```
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

## Testing Email Functionality

1. Start the backend server
2. Register a new user with your email address
3. Check your email inbox for the OTP verification email
4. If emails don't arrive, check the server terminal for error messages

## Troubleshooting

- **"Authentication failed"**: Make sure you're using an App Password, not your regular password
- **"Connection refused"**: Check your internet connection and firewall settings
- **"Emails not received"**: Check spam/junk folder, verify email address is correct
- **"SMTP server not found"**: Verify SMTP server settings for your email provider

## Security Notes

- Never share your App Password
- Use environment variables for sensitive information
- Consider using OAuth2 for production applications
- Regularly rotate your App Passwords
