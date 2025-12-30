import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validace
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Vyplňte prosím jméno, email a zprávu' },
        { status: 400 }
      );
    }

    // Email technikům
    const technicianEmails = [
      'kracmer.tom@gmail.com',
      'kominici.stepanek@email.cz'
    ];

    const technicianEmailPromise = resend.emails.send({
      from: 'KSKominíci <noreply@kskominici.com>',
      to: technicianEmails,
      subject: `Nový dotaz od ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1f2937 0%, #000000 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">📧 Nový dotaz z webu</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1f2937; margin-top: 0;">Kontaktní údaje</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Jméno:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                    </td>
                  </tr>
                  ${phone ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Telefon:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: #1f2937; margin-top: 0;">Zpráva</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                  <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${message}</p>
                </div>
              </div>

              <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>💡 Tip:</strong> Odpovězte zákazníkovi co nejdříve pro zajištění nejvyšší kvality služeb.
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">© 2024 KSKominíci - Profesionální kominické služby</p>
              <p style="margin: 5px 0 0 0;">IČO: 87484510</p>
            </div>
          </body>
        </html>
      `,
    });

    // Auto-reply zákazníkovi
    const customerReplyPromise = resend.emails.send({
      from: 'KSKominíci <noreply@kskominici.com>',
      to: email,
      subject: 'Děkujeme za Váš dotaz - KSKominíci',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1f2937 0%, #000000 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">KSKominíci</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Profesionální kominické služby</p>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1f2937; margin-top: 0;">Děkujeme za Váš dotaz!</h2>
                <p style="color: #374151; margin: 15px 0;">Dobrý den ${name},</p>
                <p style="color: #374151; margin: 15px 0;">
                  Vaši zprávu jsme úspěšně přijali a předali našim technikům. 
                  <strong>Ozveme se Vám co nejdříve</strong>, obvykle do 24 hodin.
                </p>
              </div>

              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-top: 0;">Váš dotaz:</h3>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                  <p style="margin: 0; white-space: pre-wrap; color: #1f2937; font-style: italic;">${message}</p>
                </div>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚡ Naléhavý problém nebo dotaz?</h3>
                <p style="color: #92400e; margin: 10px 0 0 0;">
                  V případě urgentní záležitosti nás kontaktujte přímo na telefonních číslech:
                </p>
              </div>

              <div style="background: white; padding: 25px; border-radius: 8px;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">📞 Naši specialisté</h3>
                
                <div style="margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
                  <p style="margin: 0; font-weight: bold; color: #1f2937;">Tomáš Kračmer</p>
                  <p style="margin: 5px 0 0 0; color: #374151;">
                    Tel: <a href="tel:+420721977044" style="color: #2563eb; text-decoration: none;">+420 721 977 044</a><br>
                    Email: <a href="mailto:kracmer.tom@gmail.com" style="color: #2563eb; text-decoration: none;">kracmer.tom@gmail.com</a>
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">
                    Oblast: Praha / Praha východ / okres Benešov a okolí
                  </p>
                </div>

                <div style="margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
                  <p style="margin: 0; font-weight: bold; color: #1f2937;">Jakub Štěpánek</p>
                  <p style="margin: 5px 0 0 0; color: #374151;">
                    Tel: <a href="tel:+420776724300" style="color: #2563eb; text-decoration: none;">+420 776 724 300</a><br>
                    Email: <a href="mailto:kominici.stepanek@email.cz" style="color: #2563eb; text-decoration: none;">kominici.stepanek@email.cz</a>
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">
                    Oblast: Praha / Praha východ / okres Mladá Boleslav a okolí
                  </p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">S pozdravem,</p>
              <p style="margin: 5px 0; font-weight: bold; color: #1f2937;">Tým KSKominíci</p>
              <p style="margin: 10px 0 0 0;">© 2024 KSKominíci - IČO: 87484510</p>
              <p style="margin: 5px 0 0 0;">
                <a href="https://kskominici.com" style="color: #2563eb; text-decoration: none;">www.kskominici.com</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    // Počkej na oba emaily
    const [technicianResult, customerResult] = await Promise.all([
      technicianEmailPromise,
      customerReplyPromise
    ]);

    console.log('Technician email sent:', technicianResult);
    console.log('Customer auto-reply sent:', customerResult);

    return NextResponse.json(
      { 
        success: true,
        message: 'Zpráva byla úspěšně odeslána. Brzy se Vám ozveme!'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending contact form:', error);
    return NextResponse.json(
      { 
        error: 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu nebo nás kontaktujte telefonicky.' 
      },
      { status: 500 }
    );
  }
}
