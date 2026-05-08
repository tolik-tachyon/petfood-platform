package dev.pet.notifications.services;

import dev.pet.notifications.config.SmtpProps;
import jakarta.annotation.PostConstruct;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Properties;

/**
 * Sends mail via configurable SMTP (Gmail, Brevo, etc.).
 */
@Service
public class SmtpMailSender {

    private final SmtpProps props;
    private Session session;

    public SmtpMailSender(SmtpProps props) {
        this.props = props;
    }

    @PostConstruct
    public void init() {
        Properties p = new Properties();
        p.put("mail.smtp.host", props.getHost());
        p.put("mail.smtp.port", String.valueOf(props.getPort()));

        if (props.isSsl()) {
            p.put("mail.smtp.ssl.enable", "true");
        } else if (props.isStartTls()) {
            p.put("mail.smtp.starttls.enable", "true");
        }

        boolean needsAuth = props.getUser() != null && !props.getUser().isBlank()
            && props.getPass() != null && !props.getPass().isBlank();

        if (needsAuth) {
            p.put("mail.smtp.auth", "true");
            this.session = Session.getInstance(
                p,
                new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(props.getUser(), props.getPass());
                    }
                }
            );
        } else {
            p.put("mail.smtp.auth", "false");
            this.session = Session.getInstance(p);
        }
    }

    public void sendPlainText(String to, String subject, String body, Map<String, Object> vars) {
        String resolvedBody = applyVars(body, vars);

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(parseFrom(props.getFrom()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
            message.setSubject(subject, "UTF-8");
            message.setText(resolvedBody, "UTF-8");

            Transport.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP send error", e);
        }
    }

    private static InternetAddress parseFrom(String from) throws MessagingException {
        if (from == null || from.isBlank()) {
            throw new MessagingException("SMTP from address is empty; set SMTP_GMAIL_FROM (e.g. PetFood <noreply@yourdomain.com>)");
        }
        InternetAddress[] parsed = InternetAddress.parse(from, false);
        if (parsed.length == 0) {
            throw new MessagingException("Invalid SMTP from address: " + from);
        }
        return parsed[0];
    }

    private String applyVars(String template, Map<String, Object> vars) {
        if (vars == null || vars.isEmpty()) {
            return template;
        }
        String r = template;
        for (var e : vars.entrySet()) {
            r = r.replace("{{" + e.getKey() + "}}", String.valueOf(e.getValue()));
        }
        return r;
    }

    public void sendHtml(String to, String subject, String html, Map<String, Object> vars) {
        String resolved = applyVars(html, vars);

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(parseFrom(props.getFrom()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
            message.setSubject(subject, "UTF-8");
            message.setContent(resolved, "text/html; charset=UTF-8");

            Transport.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("SMTP send error", e);
        }
    }
}
