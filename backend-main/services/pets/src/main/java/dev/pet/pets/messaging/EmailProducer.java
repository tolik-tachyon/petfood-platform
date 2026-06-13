package dev.pet.pets.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EmailProducer {

    private static final String EXCHANGE = "mail.x";
    private static final String RK_RECOMMENDATION = "mail.recommendation";

    private final RabbitTemplate rt;
    private final ObjectMapper om;

    public EmailProducer(RabbitTemplate rt, ObjectMapper om) {
        this.rt = rt;
        this.om = om;
    }

    public record EmailMessage(
        String to,
        String subject,
        String template,
        Map<String, Object> vars
    ) {}

    public void sendRecommendationEmail(String to, String subject, String htmlTemplate, Map<String, Object> vars) {
        EmailMessage msg = new EmailMessage(to, subject, htmlTemplate, vars);
        rt.convertAndSend(EXCHANGE, RK_RECOMMENDATION, toJson(msg));
    }

    private String toJson(Object o) {
        try {
            return om.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize email message", e);
        }
    }
}
