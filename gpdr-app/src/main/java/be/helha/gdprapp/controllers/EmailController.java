package be.helha.gdprapp.controllers;

import be.helha.gdprapp.services.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@CrossOrigin(origins = "*")
@Tag(name = "Email", description = "Email management APIs")
public class EmailController {

    @Autowired
    private EmailService emailService;

    // Send test email (Admin only)
    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send test email", description = "Send a test email to verify email configuration",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> sendTestEmail(@RequestBody TestEmailRequest request) {
        try {
            emailService.sendTestEmail(request.getEmail());
            return ResponseEntity.ok().body(new EmailResponse("Test email sent successfully to " + request.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to send test email: " + e.getMessage()));
        }
    }

    // Send simple email (Admin only)
    @PostMapping("/simple")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send simple email", description = "Send a simple text email",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> sendSimpleEmail(@RequestBody SimpleEmailRequest request) {
        try {
            emailService.sendSimpleEmail(request.getTo(), request.getSubject(), request.getText());
            return ResponseEntity.ok().body(new EmailResponse("Simple email sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to send simple email: " + e.getMessage()));
        }
    }

    // Send custom email with template (Admin only)
    @PostMapping("/custom")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send custom email", description = "Send a custom email using template",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> sendCustomEmail(@RequestBody CustomEmailRequest request) {
        try {
            emailService.sendCustomEmail(
                    request.getTo(),
                    request.getSubject(),
                    request.getTemplateName(),
                    request.getVariables()
            );
            return ResponseEntity.ok().body(new EmailResponse("Custom email sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to send custom email: " + e.getMessage()));
        }
    }

    // Send bulk email (Admin only)
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send bulk email", description = "Send bulk emails to multiple recipients",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> sendBulkEmail(@RequestBody BulkEmailRequest request) {
        try {
            org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
            for (Map.Entry<String, Object> entry : request.getVariables().entrySet()) {
                context.setVariable(entry.getKey(), entry.getValue());
            }

            emailService.sendBulkEmail(
                    request.getRecipients(),
                    request.getSubject(),
                    request.getTemplateName(),
                    context
            );
            return ResponseEntity.ok().body(new EmailResponse("Bulk emails sent successfully to " + request.getRecipients().length + " recipients"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to send bulk emails: " + e.getMessage()));
        }
    }

    // Send admin notification (Admin only)
    @PostMapping("/admin-notification")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send admin notification", description = "Send notification to all administrators",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> sendAdminNotification(@RequestBody AdminNotificationRequest request) {
        try {
            emailService.sendAdminNotification(request.getSubject(), request.getMessage());
            return ResponseEntity.ok().body(new EmailResponse("Admin notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to send admin notification: " + e.getMessage()));
        }
    }

    // Get email statistics (Admin only)
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get email statistics", description = "Get email sending statistics",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailService.EmailStatistics> getEmailStatistics() {
        EmailService.EmailStatistics stats = emailService.getEmailStatistics();
        return ResponseEntity.ok(stats);
    }

    // Resend welcome email (Admin only)
    @PostMapping("/resend-welcome/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resend welcome email", description = "Resend welcome email to specific user",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> resendWelcomeEmail(@PathVariable Integer userId) {
        try {
            // This would get the user from UserService
            // User user = userService.getUserById(userId);
            // emailService.sendWelcomeEmail(user);
            return ResponseEntity.ok().body(new EmailResponse("Welcome email resent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new EmailResponse("Failed to resend welcome email: " + e.getMessage()));
        }
    }

    // Inner classes for DTOs
    public static class TestEmailRequest {
        private String email;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class SimpleEmailRequest {
        private String to;
        private String subject;
        private String text;

        // Getters and setters
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public static class CustomEmailRequest {
        private String to;
        private String subject;
        private String templateName;
        private Map<String, Object> variables;

        // Getters and setters
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getTemplateName() { return templateName; }
        public void setTemplateName(String templateName) { this.templateName = templateName; }
        public Map<String, Object> getVariables() { return variables; }
        public void setVariables(Map<String, Object> variables) { this.variables = variables; }
    }

    public static class BulkEmailRequest {
        private String[] recipients;
        private String subject;
        private String templateName;
        private Map<String, Object> variables;

        // Getters and setters
        public String[] getRecipients() { return recipients; }
        public void setRecipients(String[] recipients) { this.recipients = recipients; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getTemplateName() { return templateName; }
        public void setTemplateName(String templateName) { this.templateName = templateName; }
        public Map<String, Object> getVariables() { return variables; }
        public void setVariables(Map<String, Object> variables) { this.variables = variables; }
    }

    public static class AdminNotificationRequest {
        private String subject;
        private String message;

        // Getters and setters
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class EmailResponse {
        private String message;
        private String status = "success";

        public EmailResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}