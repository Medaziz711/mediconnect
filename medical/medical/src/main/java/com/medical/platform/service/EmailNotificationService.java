package com.medical.platform.service;

import org.springframework.stereotype.Service;

/**
 * Sends emails (e.g. via Gmail SMTP) when admin accepts or rejects doctor/pharmacist registration.
 * Configure Gmail in application.properties and add spring-boot-starter-mail to use real sending.
 */
@Service
public class EmailNotificationService {

    private final EmailService emailService;

    public EmailNotificationService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void sendInscriptionAcceptee(String toEmail, String userName) {
        String subject = "Bienvenue sur Mediconnect Pro - Inscription Approuvée";
        String body = "Bonjour " + userName + ",\n\n" +
                "Nous avons le plaisir de vous informer que votre inscription sur Mediconnect Pro a été approuvée par notre équipe administrative.\n\n" +
                "Vous pouvez dès à présent vous connecter à votre compte en utilisant votre adresse Gmail :\n" +
                "Lien de connexion : http://localhost:4200/auth\n\n" +
                "Merci de nous faire confiance pour votre exercice professionnel.\n\n" +
                "Cordialement,\n" +
                "L'équipe Administrative Mediconnect Pro";
        
        emailService.sendEmail(toEmail, subject, body);
    }

    public void sendInscriptionRejetee(String toEmail, String userName, String motifRejet) {
        String subject = "Information concernant votre inscription - Mediconnect Pro";
        String body = "Bonjour " + userName + ",\n\n" +
                "Nous avons examiné votre demande d'inscription sur Mediconnect Pro.\n\n" +
                "Malheureusement, nous ne pouvons pas valider votre compte pour la raison suivante :\n" +
                "\"" + motifRejet + "\"\n\n" +
                "Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez fournir des informations complémentaires, n'hésitez pas à nous contacter.\n\n" +
                "Cordialement,\n" +
                "L'équipe Administrative Mediconnect Pro";
        
        emailService.sendEmail(toEmail, subject, body);
    }
}
