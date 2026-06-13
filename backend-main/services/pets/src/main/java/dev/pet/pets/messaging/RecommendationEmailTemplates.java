package dev.pet.pets.messaging;

public final class RecommendationEmailTemplates {
    private RecommendationEmailTemplates() {}

    public static String recommendationHtml() {
        return """
        <!doctype html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
          <div style="max-width:640px;margin:0 auto;padding:24px;">
            <div style="background:#ffffff;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.06);overflow:hidden;">
              <div style="padding:18px 22px;border-bottom:1px solid #eef1f4;">
                <div style="font-size:16px;font-weight:700;color:#111;">{{title}}</div>
              </div>

              <div style="padding:22px;color:#1f2937;font-size:14px;line-height:1.6;">
                <div style="margin-bottom:14px;">
                  {{text}}
                </div>

                <a href="{{url}}"
                   style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                          padding:12px 18px;border-radius:10px;font-weight:700;">
                  Посмотреть
                </a>
              </div>

              <div style="padding:16px 22px;border-top:1px solid #eef1f4;color:#6b7280;font-size:12px;">
                PetFood
              </div>
            </div>
          </div>
        </body>
        </html>
        """;
    }
}
