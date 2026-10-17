import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { CacheService } from 'common/service/cache.service';
import { AuthRepository } from 'repository';
import { ComparePassword, HashPassword } from './security/Hash';
import { EmailService } from './email.service'
@Injectable()
export class SendEmail {
  public emailEvent: EventEmitter;

  constructor(
    private readonly redisService: CacheService,
    private readonly emailService: EmailService,
    private readonly authRepo: AuthRepository,
  ) {
    this.emailEvent = new EventEmitter();
    this.registerEventListeners();
  }

  private registerEventListeners() {
    this.emailEvent.on('send_email', async (data) => {
      try {
        const { email, name, userID } = data;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        let Hashcode = await HashPassword({ plainText: code });
        await this.redisService.set({
          key: `key::${userID}`,
          value: Hashcode,
          ttl: 500,
        });
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify</title>
        </head>
        <body style="
          margin:0;
          padding:0;
          background: radial-gradient(circle at top, #0f172a, #020617);
          font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;
        ">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:50px 20px;">
                <table width="420" cellpadding="0" cellspacing="0" style="
                  border-radius:20px;
                  background: linear-gradient(145deg, #0ea5e9, #9333ea);
                  padding:1px;
                ">
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" style="
                        background:#020617;
                        border-radius:20px;
                        padding:40px;
                        color:#e2e8f0;
                      ">
                        <tr>
                          <td style="text-align:center; padding-bottom:30px;">
                            <div style="
                              font-size:13px;
                              letter-spacing:2px;
                              color:#64748b;
                            ">
                              SECURE ACCESS
                            </div>
                            <h1 style="
                              margin:10px 0 0;
                              font-size:28px;
                              color:#fff;
                              font-weight:700;
                            ">
                              Welcome, ${name} 👋
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div style="
                              height:1px;
                              background:linear-gradient(to right, transparent, #334155, transparent);
                              margin:20px 0;
                            "></div>
                          </td>
                        </tr>
                        <tr>
                          <td style="
                            font-size:15px;
                            color:#94a3b8;
                            text-align:center;
                            line-height:1.6;
                            padding-bottom:25px;
                          ">
                            Use the code below to unlock your access.<br/>
                            This code expires in <strong style="color:#38bdf8;">5 minutes</strong>.
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:30px 0;">
                            <div style="
                              display:inline-block;
                              padding:18px 30px;
                              font-size:32px;
                              letter-spacing:10px;
                              font-weight:800;
                              color:#38bdf8;
                              background:#020617;
                              border-radius:14px;
                              border:1px solid #1e293b;
                              box-shadow:
                                0 0 20px rgba(56,189,248,0.4),
                                inset 0 0 10px rgba(56,189,248,0.2);
                            ">
                              ${code}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:10px 0 30px;">
                            <a href="#" style="
                              text-decoration:none;
                              display:inline-block;
                              padding:14px 30px;
                              font-size:14px;
                              font-weight:600;
                              color:#020617;
                              background:linear-gradient(135deg, #38bdf8, #6366f1);
                              border-radius:10px;
                              box-shadow:0 10px 25px rgba(99,102,241,0.4);
                            ">
                              Verify Account →
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="
                            text-align:center;
                            font-size:12px;
                            color:#475569;
                          ">
                            If you didn’t request this, just ignore it.<br/>
                            Your account is still safe.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <div style="
                  font-size:11px;
                  color:#334155;
                  margin-top:20px;
                ">
                  Powered by "Hazem_App" ⚡
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `;

        await this.emailService.sendEmail(
          email,
          'Your Verification Code',
          html,
        );
      } catch (error) {
        console.error('Error in send_email event:', error);
        throw error;
      }
    });

    this.emailEvent.on('varify_email', async (data) => {
      try {
        const { email, code, userID, name } = data;
        let rediscode = await this.redisService.get(`key::${userID}`);

        if (!rediscode) {
          throw new NotFoundException('OTP is Expired');
        }

        let compareCode = await ComparePassword({
          PlainText: code,
          CipherText: rediscode.toString(),
        });
        console.log(userID)
        console.log(compareCode)
        if (!compareCode) {
          throw new NotFoundException('Invalid OTP code');
        }
        
        let verifyUser = await this.authRepo.findByIdAndUpdate(
          userID,
          { isverify: true },
          { new: 1 },
        );
        if (!verifyUser) {
          throw new BadRequestException('failed to varify user');
        }

        await this.redisService.del(`key::${userID}`);

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verified</title>
        </head>
        <body style="
          margin:0;
          padding:0;
          background: radial-gradient(circle at top, #022c22, #020617);
          font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;
        ">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:50px 20px;">
                <table width="420" cellpadding="0" cellspacing="0" style="
                  border-radius:20px;
                  background: linear-gradient(135deg, #22c55e, #38bdf8);
                  padding:1px;
                ">
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" style="
                        background:#020617;
                        border-radius:20px;
                        padding:40px;
                        color:#e2e8f0;
                      ">
                        <tr>
                          <td align="center" style="padding-bottom:25px;">
                            <div style="
                              font-size:50px;
                              line-height:1;
                              margin-bottom:10px;
                            ">
                              ✅
                            </div>
                            <h1 style="
                              margin:0;
                              font-size:26px;
                              color:#22c55e;
                              font-weight:700;
                            ">
                              Email Verified!
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div style="
                              height:1px;
                              background:linear-gradient(to right, transparent, #334155, transparent);
                              margin:20px 0;
                            "></div>
                          </td>
                        </tr>
                        <tr>
                          <td style="
                            font-size:15px;
                            color:#94a3b8;
                            text-align:center;
                            line-height:1.6;
                            padding-bottom:30px;
                          ">
                            Hey <strong style="color:#fff;">${name}</strong> 👋<br/>
                            Your email has been successfully verified.<br/>
                            You're now ready to explore everything we built for you 🚀
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:30px;">
                            <a href="#" style="
                              text-decoration:none;
                              display:inline-block;
                              padding:14px 30px;
                              font-size:14px;
                              font-weight:600;
                              color:#020617;
                              background:linear-gradient(135deg, #22c55e, #4ade80);
                              border-radius:10px;
                              box-shadow:0 10px 25px rgba(34,197,94,0.4);
                            ">
                              Start Exploring →
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="
                            text-align:center;
                            font-size:12px;
                            color:#475569;
                          ">
                            You're all set. Let’s build something great 💚
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <div style="
                  font-size:11px;
                  color:#334155;
                  margin-top:20px;
                ">
                  Welcome aboard ⚡
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `;

        await this.emailService.sendEmail(
          email,
          'Your Verification Code',
          html,
        );
      } catch (error) {
        console.error('Error in varify_email event:', error);
        throw error;
      }
    });

    this.emailEvent.on('forget_password', async (data) => {
      try {
        let { name, userID, email } = data;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        let Hashcode = await HashPassword({ plainText: code });

        await this.redisService.set({
          key: `key::${userID}`,
          value: Hashcode,
          ttl: 500,
        });

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; padding: 0; background-color: #0f172a; 
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%; table-layout: fixed; background-color: #0f172a; padding-bottom: 40px;
            }
            .main-card {
              max-width: 500px; margin: 40px auto; background: linear-gradient(145deg, #1e293b, #0f172a);
              border: 1px solid #334155; border-radius: 24px; overflow: hidden;
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            .glow-bar {
              height: 6px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            }
            .content { padding: 40px 30px; text-align: center; color: #ffffff; }
            .icon-box {
              width: 80px; height: 80px; margin: 0 auto 20px;
              background: rgba(59, 130, 246, 0.1); border-radius: 20px;
              display: flex; align-items: center; justify-content: center;
              border: 1px solid rgba(59, 130, 246, 0.3);
              font-size: 40px;
            }
            h1 { color: #ffffff; font-size: 26px; margin-bottom: 10px; font-weight: 800; letter-spacing: -0.5px; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 10px 0; }
            
            .otp-wrapper {
              margin: 30px 0; padding: 25px;
              background: rgba(255, 255, 255, 0.03);
              border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .otp-code {
              font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold;
              letter-spacing: 12px; color: #60a5fa; text-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
              padding-left: 12px; 
            }
            
            .timer {
              display: inline-block; padding: 6px 14px; background: rgba(234, 179, 8, 0.1);
              color: #fbbf24; border-radius: 100px; font-size: 12px; font-weight: bold;
              text-transform: uppercase; letter-spacing: 1px;
            }
            .footer {
              padding: 20px; background: rgba(0,0,0,0.2); text-align: center;
              color: #475569; font-size: 11px; letter-spacing: 0.5px;
            }
            .security-note {
              font-size: 13px; margin-top: 30px; color: #64748b;
              border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="main-card">
              <div class="glow-bar"></div>
              <div class="content">
                <div class="icon-box">🔐</div>
                <h1>Identity Verification</h1>
                <p>Hello <span style="color: #3b82f6; font-weight: bold;">${name}</span>,</p>
                <p>We received a request to reset your password. Use the secure verification code below to proceed:</p>
                
                <div class="otp-wrapper">
                  <div class="otp-code">${code}</div>
                </div>

                <div class="timer">⏱️ Expires in 8 minutes</div>
                
                <div class="security-note">
                  If you didn't request this code, you can safely ignore this email. 
                  Your account security has not been compromised.
                </div>
              </div>
              <div class="footer">
                Secured by Intelligent Protection System &copy; ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
        </html>
        `;

        await this.emailService.sendEmail(email, 'Forget Password', html);
      } catch (error) {
        console.error('Error in forget_password event:', error);
        throw error;
      }
    });

    this.emailEvent.on('resetPassword', async (data) => {
      try {
        let { code, name, email, userID, host } = data;
        let rediscode = await this.redisService.get(`key::${userID}`);

        if (!rediscode) {
          throw new NotFoundException('OTP is Expired');
        }

        let compareCode = await ComparePassword({PlainText: code , CipherText: rediscode.toString()});
        if (!compareCode) {
          throw new NotFoundException('OTP is Expired');
        }

        await this.redisService.del(`key::${userID}`);

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; padding: 0; background-color: #050505; 
              font-family: 'Inter', -apple-system, sans-serif;
            }
            .wrapper {
              width: 100%; background-color: #050505; padding: 60px 0;
            }
            .main-card {
              max-width: 480px; margin: 0 auto; background: #0f1115;
              border: 1px solid #222; border-radius: 32px; overflow: hidden;
              box-shadow: 0 40px 100px rgba(0,0,0,0.8);
            }
            .success-glow {
              height: 4px; background: linear-gradient(90deg, #10b981, #34d399, #059669);
            }
            .content { padding: 50px 40px; text-align: center; }
            .check-icon {
              width: 72px; height: 72px; margin: 0 auto 30px;
              background: rgba(16, 185, 129, 0.1);
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-size: 32px;
            }
            h1 { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 16px; }
            p { color: #9ca3af; font-size: 15px; line-height: 1.7; margin-bottom: 30px; }
            
            .status-badge {
              display: inline-block; padding: 8px 20px;
              background: rgba(16, 185, 129, 0.1); color: #10b981;
              border-radius: 100px; font-weight: 700; font-size: 13px;
              text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px;
            }

            .info-box {
              background: rgba(255, 255, 255, 0.03); border: 1px solid #222;
              padding: 20px; border-radius: 16px; text-align: left;
            }
            .info-box p { margin: 0; font-size: 13px; color: #6b7280; }
            
            .button-login {
              display: inline-block; margin-top: 30px; padding: 15px 30px;
              background: #3b82f6; color: #ffffff; text-decoration: none;
              border-radius: 12px; font-weight: 600; font-size: 15px;
            }

            .footer-brand {
              padding: 25px; background: rgba(0,0,0,0.2);
              text-align: center; color: #374151; font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="main-card">
              <div class="success-glow"></div>
              <div class="content">
                <div class="check-icon">✓</div>
                <div class="status-badge">Update Successful</div>
                <h1>Password Changed</h1>
                <p>Hi <strong>${name}</strong>,<br>Your password has been successfully updated. You can now use your new password to log in to your account.</p>
                
                <div class="info-box">
                  <p><strong>Action:</strong> Password Reset</p>
                  <p><strong>Status:</strong> Completed</p>
                  <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
                </div>

                <a href="${host}" class="button-login">
                  Back to Login
                </a>

                <p style="margin-top: 40px; font-size: 12px; color: #4b5563;">
                  If you did not perform this action, please contact our security team immediately.
                </p>
              </div>
              <div class="footer-brand">
                Your Account Security is our Priority &copy; ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
        </html>
        `;

        await this.emailService.sendEmail(email, 'resetPassword', html);
      } catch (error) {
        console.error('Error in resetPassword event:', error);
        throw error;
      }
    });
  }
}
