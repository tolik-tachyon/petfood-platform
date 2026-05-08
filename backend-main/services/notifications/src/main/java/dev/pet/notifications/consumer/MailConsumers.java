package dev.pet.notifications.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.notifications.services.SmtpMailSender;
import dev.pet.notifications.services.HtmlEmailTemplate;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MailConsumers {
    private final ObjectMapper om = new ObjectMapper();
    private final SmtpMailSender mailer;

    public MailConsumers(SmtpMailSender mailer) {
        this.mailer = mailer;
    }

    public record EmailMessage(String to, String subject, String template, java.util.Map<String, Object> vars) {}

    @RabbitListener(queues = "mail.q.confirm")
    public void onConfirm(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] CONFIRM → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String code = codeFrom(msg);
        String lead = msg.subject() != null && msg.subject().contains("новый")
            ? "Подтвердите новый адрес электронной почты — введите код в приложении."
            : "Завершите регистрацию — введите код в приложении.";
        String html = HtmlEmailTemplate.verificationCodeEmail(msg.subject(), code, lead);

        mailer.sendHtml(msg.to(), msg.subject(), html, null);
    }

    @RabbitListener(queues = "mail.q.twofa")
    public void onTwofa(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] 2FA    → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String code = codeFrom(msg);
        String lead = "Вы входите с включённой двухфакторной аутентификацией. Введите код ниже в форме входа.";
        String html = HtmlEmailTemplate.verificationCodeEmail(msg.subject(), code, lead);

        mailer.sendHtml(msg.to(), msg.subject(), html, null);
    }

    @RabbitListener(queues = "mail.q.password-reset")
    public void onPasswordReset(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] RESET  → To:%s | Subject:%s | Code:%s%n",
            msg.to(), msg.subject(), msg.vars() == null ? null : msg.vars().get("code"));

        String code = codeFrom(msg);
        String lead = "Вы запросили восстановление пароля. Введите код на странице сброса пароля.";
        String html = HtmlEmailTemplate.verificationCodeEmail(msg.subject(), code, lead);

        mailer.sendHtml(msg.to(), msg.subject(), html, null);
    }

    @RabbitListener(queues = "mail.q.password")
    public void onPasswordChanged(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] PWDCH  → To:%s | Subject:%s%n",
            msg.to(), msg.subject());

        String body = "Пароль вашей учётной записи был успешно изменён.\n\n"
            + "Если это были не вы, срочно свяжитесь с поддержкой и восстановите доступ.";
        String html = HtmlEmailTemplate.infoNoticeEmail(msg.subject(), "Готово", body);

        mailer.sendHtml(msg.to(), msg.subject(), html, null);
    }

    @RabbitListener(queues = "mail.q.recommendation")
    public void onRecommendation(String json) throws Exception {
        var msg = om.readValue(json, EmailMessage.class);

        System.out.printf("[MAILER] RECOMM → To:%s | Subject:%s%n",
            msg.to(), msg.subject());

        mailer.sendHtml(
            msg.to(),
            msg.subject(),
            msg.template(),
            msg.vars()
        );
    }

    private static String codeFrom(EmailMessage msg) {
        if (msg.vars() == null || msg.vars().get("code") == null) {
            return "";
        }
        return String.valueOf(msg.vars().get("code"));
    }
}
