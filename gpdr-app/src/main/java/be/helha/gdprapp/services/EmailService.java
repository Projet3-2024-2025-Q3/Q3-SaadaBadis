package be.helha.gdprapp.services;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.models.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${app.mail.from:noreply@gdprapp.com}")
    private String fromEmail;

    @Value("${app.name:GDPR Application}")
    private String appName;

    @Value("${app.url:http://localhost:8080}")
    private String appUrl;

    // Send simple text email
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            emailSender.send(message);
            System.out.println("Simple email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Error sending simple email to " + to + ": " + e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    // Send HTML email with template
    public void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        try {
            MimeMessage mimeMessage = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            String htmlContent = templateEngine.process(templateName, context);
            helper.setText(htmlContent, true);

            emailSender.send(mimeMessage);
            System.out.println("HTML email sent successfully to: " + to);
        } catch (MessagingException e) {
            System.err.println("Error sending HTML email to " + to + ": " + e.getMessage());
            throw new RuntimeException("Failed to send HTML email", e);
        }
    }

    // Send welcome email to new users
    public void sendWelcomeEmail(User user) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("appName", appName);
        context.setVariable("appUrl", appUrl);

        String subject = "Welcome to " + appName + "!";
        sendHtmlEmail(user.getEmail(), subject, "welcome-email", context);
    }

    // Send password reset email
    public void sendPasswordResetEmail(User user, String resetToken) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("resetToken", resetToken);
        context.setVariable("appName", appName);
        context.setVariable("resetUrl", appUrl + "/reset-password?token=" + resetToken);
        context.setVariable("expirationTime", "24 hours");

        String subject = "Password Reset Request - " + appName;
        sendHtmlEmail(user.getEmail(), subject, "password-reset-email", context);
    }

    // Send GDPR request confirmation to user
    public void sendGDPRRequestConfirmation(User user, GDPRRequest request) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("request", request);
        context.setVariable("appName", appName);
        context.setVariable("requestDate", request.getRequestDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String subject = "GDPR Request Confirmation - " + appName;
        sendHtmlEmail(user.getEmail(), subject, "gdpr-request-confirmation", context);
    }

    // Send GDPR request notification to company
    public void sendGDPRRequestNotification(Company company, GDPRRequest request) {
        Context context = new Context();
        context.setVariable("company", company);
        context.setVariable("request", request);
        context.setVariable("user", request.getUser());
        context.setVariable("appName", appName);
        context.setVariable("requestDate", request.getRequestDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        context.setVariable("dashboardUrl", appUrl + "/dashboard");

        String subject = "New GDPR Request - " + request.getRequestType() + " - " + appName;
        sendHtmlEmail(company.getEmail(), subject, "gdpr-request-notification", context);
    }

    // Send GDPR request status update to user
    public void sendGDPRRequestStatusUpdate(User user, GDPRRequest request, String oldStatus) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("request", request);
        context.setVariable("oldStatus", oldStatus);
        context.setVariable("newStatus", request.getStatus());
        context.setVariable("appName", appName);
        context.setVariable("updateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String subject = "GDPR Request Update - " + request.getStatus() + " - " + appName;
        sendHtmlEmail(user.getEmail(), subject, "gdpr-request-status-update", context);
    }

    // Send account activation email
    public void sendAccountActivationEmail(User user, String activationToken) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("activationToken", activationToken);
        context.setVariable("appName", appName);
        context.setVariable("activationUrl", appUrl + "/activate-account?token=" + activationToken);
        context.setVariable("expirationTime", "7 days");

        String subject = "Activate Your Account - " + appName;
        sendHtmlEmail(user.getEmail(), subject, "account-activation-email", context);
    }

    // Send account deactivation notification
    public void sendAccountDeactivationEmail(User user) {
        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("appName", appName);
        context.setVariable("supportEmail", fromEmail);
        context.setVariable("deactivationDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

        String subject = "Account Deactivated - " + appName;
        sendHtmlEmail(user.getEmail(), subject, "account-deactivation-email", context);
    }

    // Send bulk email to multiple recipients
    public void sendBulkEmail(String[] recipients, String subject, String templateName, Context context) {
        for (String recipient : recipients) {
            try {
                sendHtmlEmail(recipient, subject, templateName, context);
                // Add delay to avoid spam detection
                Thread.sleep(100);
            } catch (Exception e) {
                System.err.println("Failed to send email to: " + recipient + " - " + e.getMessage());
            }
        }
    }

    // Send notification to admins
    public void sendAdminNotification(String subject, String message) {
        // This would typically get admin emails from database or configuration
        String[] adminEmails = {"admin@gdprapp.com"}; // Configure this properly

        Context context = new Context();
        context.setVariable("subject", subject);
        context.setVariable("message", message);
        context.setVariable("appName", appName);
        context.setVariable("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

        sendBulkEmail(adminEmails, "[ADMIN] " + subject, "admin-notification", context);
    }

    // Test email functionality
    public void sendTestEmail(String to) {
        Context context = new Context();
        context.setVariable("appName", appName);
        context.setVariable("testTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

        String subject = "Test Email - " + appName;
        sendHtmlEmail(to, subject, "test-email", context);
    }

    // Send email with custom template and data
    public void sendCustomEmail(String to, String subject, String templateName, java.util.Map<String, Object> variables) {
        Context context = new Context();

        // Add default variables
        context.setVariable("appName", appName);
        context.setVariable("appUrl", appUrl);
        context.setVariable("currentDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Add custom variables
        for (java.util.Map.Entry<String, Object> entry : variables.entrySet()) {
            context.setVariable(entry.getKey(), entry.getValue());
        }

        sendHtmlEmail(to, subject, templateName, context);
    }

    // Email statistics and monitoring
    public EmailStatistics getEmailStatistics() {
        // This would typically come from a database or monitoring system
        EmailStatistics stats = new EmailStatistics();
        stats.setTotalEmailsSent(0L); // Implement actual counting
        stats.setTotalEmailsFailed(0L);
        stats.setTotalEmailsToday(0L);
        return stats;
    }

    // Inner class for email statistics
    public static class EmailStatistics {
        private Long totalEmailsSent;
        private Long totalEmailsFailed;
        private Long totalEmailsToday;

        // Getters and setters
        public Long getTotalEmailsSent() { return totalEmailsSent; }
        public void setTotalEmailsSent(Long totalEmailsSent) { this.totalEmailsSent = totalEmailsSent; }

        public Long getTotalEmailsFailed() { return totalEmailsFailed; }
        public void setTotalEmailsFailed(Long totalEmailsFailed) { this.totalEmailsFailed = totalEmailsFailed; }

        public Long getTotalEmailsToday() { return totalEmailsToday; }
        public void setTotalEmailsToday(Long totalEmailsToday) { this.totalEmailsToday = totalEmailsToday; }
    }
}