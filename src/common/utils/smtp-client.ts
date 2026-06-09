import * as net from 'net';
import * as tls from 'tls';

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Custom SMTP Client written using Node's native socket/tls modules.
 * This is used to bypass the need to install external packages like nodemailer
 * when running inside restricted sandbox environments.
 */
export async function sendMail(config: SmtpConfig, mail: MailOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const isSecure = config.secure || config.port === 465;
    let socket: net.Socket;

    const options = {
      host: config.host,
      port: config.port,
      rejectUnauthorized: false, // Avoid TLS certificate verification errors for dev/test servers
    };

    console.log(`[SMTP Client] Connecting to ${config.host}:${config.port} (secure: ${isSecure})`);

    if (isSecure) {
      socket = tls.connect(options);
    } else {
      socket = net.connect(options);
    }

    let step = 0;
    let responseData = '';

    const write = (cmd: string) => {
      // Don't print sensitive information like password in logs
      if (step === 4) {
        console.log('[SMTP Client] Sent: [BASE64_PASSWORD]');
      } else if (step === 3) {
        console.log('[SMTP Client] Sent: [BASE64_USERNAME]');
      } else {
        console.log('[SMTP Client] Sent:', cmd.trim());
      }
      socket.write(cmd + '\r\n');
    };

    socket.on('data', (data) => {
      const response = data.toString();
      responseData += response;
      console.log('[SMTP Server] Response:', response.trim());

      const lines = response.split('\r\n').filter(l => l.trim().length > 0);
      const lastLine = lines[lines.length - 1];
      const code = lastLine.substring(0, 3);
      const isMultiline = lastLine.charAt(3) === '-';

      if (isMultiline) {
        // Wait for the final line of the multi-line response
        return;
      }

      try {
        switch (step) {
          case 0: // Greeting
            if (code === '220') {
              step = 1;
              write(`EHLO ${config.host}`);
            } else {
              throw new Error(`Unexpected greeting: ${response}`);
            }
            break;

          case 1: // EHLO Response
            if (code === '250') {
              if (config.auth && config.auth.user && config.auth.pass) {
                step = 2;
                write('AUTH LOGIN');
              } else {
                step = 5;
                write(`MAIL FROM:<${config.from}>`);
              }
            } else {
              throw new Error(`EHLO command failed: ${response}`);
            }
            break;

          case 2: // AUTH LOGIN Response
            if (code === '334') {
              step = 3;
              const userBase64 = Buffer.from(config.auth.user).toString('base64');
              write(userBase64);
            } else {
              throw new Error(`AUTH LOGIN initialization failed: ${response}`);
            }
            break;

          case 3: // Username response
            if (code === '334') {
              step = 4;
              const passBase64 = Buffer.from(config.auth.pass).toString('base64');
              write(passBase64);
            } else {
              throw new Error(`Username login failed: ${response}`);
            }
            break;

          case 4: // Password response / Auth Success
            if (code === '235' || code === '250') {
              step = 5;
              write(`MAIL FROM:<${config.from}>`);
            } else {
              throw new Error(`Authentication password failed: ${response}`);
            }
            break;

          case 5: // MAIL FROM Response
            if (code === '250') {
              step = 6;
              write(`RCPT TO:<${mail.to}>`);
            } else {
              throw new Error(`MAIL FROM failed: ${response}`);
            }
            break;

          case 6: // RCPT TO Response
            if (code === '250') {
              step = 7;
              write('DATA');
            } else {
              throw new Error(`RCPT TO failed: ${response}`);
            }
            break;

          case 7: // DATA Response
            if (code === '354') {
              step = 8;
              const boundary = '----=_Part_' + Math.random().toString(36).substring(2);
              let msg = '';
              msg += `From: ${config.from}\r\n`;
              msg += `To: ${mail.to}\r\n`;
              msg += `Subject: ${mail.subject}\r\n`;
              msg += `MIME-Version: 1.0\r\n`;
              
              if (mail.html) {
                msg += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
                msg += `--${boundary}\r\n`;
                msg += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
                msg += `${mail.text}\r\n\r\n`;
                msg += `--${boundary}\r\n`;
                msg += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
                msg += `${mail.html}\r\n\r\n`;
                msg += `--${boundary}--`;
              } else {
                msg += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
                msg += mail.text;
              }
              
              msg += '\r\n.';
              write(msg);
            } else {
              throw new Error(`DATA start failed: ${response}`);
            }
            break;

          case 8: // DATA End Response
            if (code === '250') {
              step = 9;
              write('QUIT');
            } else {
              throw new Error(`Sending message data failed: ${response}`);
            }
            break;

          case 9: // QUIT Response
            socket.end();
            resolve();
            break;
        }
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.on('error', (err) => {
      console.error('[SMTP Client Error]', err);
      reject(err);
    });

    socket.on('close', () => {
      if (step < 9) {
        reject(new Error(`SMTP connection closed prematurely. Last step: ${step}, Response data: ${responseData}`));
      }
    });
  });
}
