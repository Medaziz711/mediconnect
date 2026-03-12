package com.medical.platform.service;
 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
 
@Service
public class EmailService {
 
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
 
    @Value("${spring.mail.username}")
    private String senderEmail;
 
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
 
    public void sendEmail(String to, String subject, String body) {
        try {
            logger.info("Attempting to send email to: {} with subject: {}", to, subject);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Email successfully sent to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e);
        }
    }

    public void sendOTP(String to, String otp) {
        logger.info("Preparing to send OTP to: {}", to);
        String subject = "Mediconnect Pro - Votre code de vérification";
        String body = "Bonjour,\n\n" +
                "Votre code de vérification pour Mediconnect Pro est : " + otp + "\n\n" +
                "Ce code expirera dans 5 minutes.\n\n" +
                "Cordialement,\n" +
                "L'équipe Mediconnect Pro";
        sendEmail(to, subject, body);
    }
}
