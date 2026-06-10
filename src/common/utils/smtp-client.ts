import * as https from 'https';

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * SendGrid Mail Client using Node's native HTTPS module.
 * Replaces the custom socket-level SMTP client.
 */
export async function sendMail(config: SmtpConfig, mail: MailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY || config.auth?.pass;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || config.from || 'no-reply@payroll.com';

  if (!apiKey) {
    throw new Error('SendGrid API key (SENDGRID_API_KEY) is not configured.');
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      personalizations: [
        {
          to: [
            {
              email: mail.to,
            },
          ],
          subject: mail.subject,
        },
      ],
      from: {
        email: fromEmail,
        name: 'Payroll Management System',
      },
      content: [
        {
          type: 'text/plain',
          value: mail.text,
        },
        ...(mail.html
          ? [
              {
                type: 'text/html',
                value: mail.html,
              },
            ]
          : []),
      ],
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    console.log(`[SendGrid API] Sending email to ${mail.to} via api.sendgrid.com`);

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[SendGrid API] Email sent successfully to ${mail.to}`);
          resolve();
        } else {
          console.error(`[SendGrid API] Error status: ${res.statusCode}, body: ${responseBody}`);
          reject(new Error(`SendGrid API returned status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SendGrid API Request Error]', err);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}
