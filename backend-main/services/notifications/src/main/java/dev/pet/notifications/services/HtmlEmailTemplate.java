package dev.pet.notifications.services;

/**
 * Inline-styled HTML for transactional mail (works in Gmail, Apple Mail, Brevo, etc.).
 */
public final class HtmlEmailTemplate {
    private HtmlEmailTemplate() {}

    private static final String BRAND = "PetFood";
    /** Primary brand orange */
    private static final String ACCENT = "#f2704c";
    /** Slightly deeper orange for gradient */
    private static final String ACCENT_DEEP = "#e85d38";
    /** Light tint behind the code */
    private static final String ACCENT_SOFT = "#fff0ec";
    /** Border on code card */
    private static final String ACCENT_BORDER = "#fbc9b4";
    /** Label above code */
    private static final String ACCENT_MUTED_TEXT = "#b45309";
    /** Monospace code digits */
    private static final String ACCENT_CODE_TEXT = "#7c2d12";

    public static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    public static String textToHtml(String text) {
        String e = escape(text);
        return e.replace("\n", "<br/>");
    }

    /**
     * Email with a prominent one-time code (2FA, registration, password reset).
     */
    public static String verificationCodeEmail(String pageTitle, String code, String leadParagraph) {
        String safeTitle = escape(pageTitle);
        String safeLead = escape(leadParagraph);
        String safeCode = escape(code == null ? "" : code);

        String inner = """
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#374151;">
              %s
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="margin:0 0 24px 0;">
              <tr>
                <td align="center" style="padding:20px 16px;background:%s;border-radius:12px;border:1px solid %s;">
                  <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:%s;margin-bottom:10px;">
                    Код подтверждения
                  </div>
                  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:0.35em;color:%s;line-height:1.2;">
                    %s
                  </div>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
              Если вы не запрашивали это письмо, просто проигнорируйте его.
            </p>
            """.formatted(safeLead, ACCENT_SOFT, ACCENT_BORDER, ACCENT_MUTED_TEXT, ACCENT_CODE_TEXT, safeCode);

        return layout(pageTitle, safeTitle, inner, safeTitle);
    }

    /**
     * Simple informational mail (e.g. password changed).
     */
    public static String infoNoticeEmail(String pageTitle, String heading, String bodyText) {
        String safeTitle = escape(pageTitle);
        String safeHeading = escape(heading);
        String safeBody = textToHtml(bodyText);

        String inner = """
            <p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:%s;">
              %s
            </p>
            <div style="font-size:15px;line-height:1.65;color:#374151;">
              %s
            </div>
            """.formatted(ACCENT, safeHeading, safeBody);

        return layout(pageTitle, safeTitle, inner, safeHeading);
    }

    /**
     * Legacy wrapper: plain title + escaped body lines.
     */
    public static String wrap(String title, String bodyHtml) {
        String safeTitle = escape(title);
        return layout(title, safeTitle, bodyHtml, safeTitle);
    }

    private static String layout(String pageTitle, String safeTitleForTag, String innerHtml, String preheaderText) {
        String pre = escape(preheaderText);
        return """
            <!doctype html>
            <html lang="ru">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <meta name="color-scheme" content="light">
              <meta name="supported-color-schemes" content="light">
              <title>%s</title>
            </head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
              <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
                %s
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background:#f3f4f6;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
                      <tr>
                        <td style="height:4px;background:linear-gradient(90deg,%s,%s);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td style="padding:28px 28px 8px 28px;">
                          <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;color:%s;">%s</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 28px 28px 28px;">
                          <h1 style="margin:0 0 20px 0;font-size:22px;line-height:1.3;font-weight:700;color:%s;">
                            %s
                          </h1>
                          %s
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 28px 24px 28px;border-top:1px solid #e5e7eb;">
                          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;">
                            © %d · %s · Сообщение отправлено автоматически.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
            safeTitleForTag,
            pre,
            ACCENT,
            ACCENT_DEEP,
            ACCENT,
            escape(BRAND),
            ACCENT,
            safeTitleForTag,
            innerHtml,
            java.time.Year.now().getValue(),
            escape(BRAND)
        );
    }
}
