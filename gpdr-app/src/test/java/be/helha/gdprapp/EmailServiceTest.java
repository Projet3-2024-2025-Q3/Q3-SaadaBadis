package be.helha.gdprapp;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.services.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender emailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    private User testUser;
    private Company testCompany;
    private GDPRRequest testGDPRRequest;
    private Role testRole;

    @BeforeEach
    void setUp() {
        // Set up test properties using ReflectionTestUtils
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@gdprapp.com");
        ReflectionTestUtils.setField(emailService, "appName", "GDPR Test App");
        ReflectionTestUtils.setField(emailService, "appUrl", "http://localhost:8080");

        // Create test entities
        testRole = new Role();
        testRole.setIdRole(1);
        testRole.setRole("CLIENT");

        testUser = new User();
        testUser.setIdUser(1);
        testUser.setFirstname("John");
        testUser.setLastname("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setActive(true);
        testUser.setRole(testRole);

        testCompany = new Company();
        testCompany.setIdCompany(1);
        testCompany.setCompanyName("Test Company");
        testCompany.setEmail("contact@testcompany.com");

        testGDPRRequest = new GDPRRequest();
        testGDPRRequest.setIdRequest(1);
        testGDPRRequest.setRequestType("DELETION");
        testGDPRRequest.setStatus("PENDING");
        testGDPRRequest.setRequestDate(LocalDateTime.now());
        testGDPRRequest.setRequestContent("Please delete my data");
        testGDPRRequest.setUser(testUser);
        testGDPRRequest.setCompany(testCompany);
    }

    @Test
    void sendSimpleEmail_ShouldSendEmailSuccessfully() {
        // Given
        String to = "test@example.com";
        String subject = "Test Subject";
        String text = "Test email content";

        // When
        emailService.sendSimpleEmail(to, subject, text);

        // Then
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(emailSender).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();
        assertEquals("test@gdprapp.com", sentMessage.getFrom());
        assertArrayEquals(new String[]{to}, sentMessage.getTo());
        assertEquals(subject, sentMessage.getSubject());
        assertEquals(text, sentMessage.getText());
    }

    @Test
    void sendSimpleEmail_WhenEmailSenderThrowsException_ShouldThrowRuntimeException() {
        // Given
        doThrow(new RuntimeException("Email sending failed")).when(emailSender).send(any(SimpleMailMessage.class));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                emailService.sendSimpleEmail("test@example.com", "Subject", "Text")
        );

        assertEquals("Failed to send email", exception.getMessage());
        verify(emailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendHtmlEmail_ShouldSendHTMLEmailSuccessfully() throws MessagingException {
        // Given
        String to = "test@example.com";
        String subject = "HTML Test";
        String templateName = "test-template";
        Context context = new Context();
        context.setVariable("testVar", "testValue");

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html><body>Test HTML</body></html>");

        // When
        emailService.sendHtmlEmail(to, subject, templateName, context);

        // Then
        verify(emailSender).createMimeMessage();
        verify(templateEngine).process(eq(templateName), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendWelcomeEmail_ShouldCallSendHtmlEmailWithCorrectParameters() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("welcome-email"), any(Context.class))).thenReturn("<html>Welcome</html>");

        // When
        emailService.sendWelcomeEmail(testUser);

        // Then
        verify(templateEngine).process(eq("welcome-email"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendGDPRRequestConfirmation_ShouldSendConfirmationEmail() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("gdpr-request-confirmation"), any(Context.class))).thenReturn("<html>GDPR Confirmation</html>");

        // When
        emailService.sendGDPRRequestConfirmation(testUser, testGDPRRequest);

        // Then
        verify(templateEngine).process(eq("gdpr-request-confirmation"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendGDPRRequestNotification_ShouldSendNotificationToCompany() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("gdpr-request-notification"), any(Context.class))).thenReturn("<html>GDPR Notification</html>");

        // When
        emailService.sendGDPRRequestNotification(testCompany, testGDPRRequest);

        // Then
        verify(templateEngine).process(eq("gdpr-request-notification"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendGDPRRequestStatusUpdate_ShouldSendStatusUpdateEmail() {
        // Given
        String oldStatus = "PENDING";
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("gdpr-request-status-update"), any(Context.class))).thenReturn("<html>Status Update</html>");

        // When
        emailService.sendGDPRRequestStatusUpdate(testUser, testGDPRRequest, oldStatus);

        // Then
        verify(templateEngine).process(eq("gdpr-request-status-update"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendAccountActivationEmail_ShouldSendActivationEmail() {
        // Given
        String activationToken = "activation-token-123";
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("account-activation-email"), any(Context.class))).thenReturn("<html>Account Activation</html>");

        // When
        emailService.sendAccountActivationEmail(testUser, activationToken);

        // Then
        verify(templateEngine).process(eq("account-activation-email"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendAccountDeactivationEmail_ShouldSendDeactivationEmail() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("account-deactivation-email"), any(Context.class))).thenReturn("<html>Account Deactivation</html>");

        // When
        emailService.sendAccountDeactivationEmail(testUser);

        // Then
        verify(templateEngine).process(eq("account-deactivation-email"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendBulkEmail_ShouldSendEmailToAllRecipients() {
        // Given
        String[] recipients = {"user1@example.com", "user2@example.com", "user3@example.com"};
        String subject = "Bulk Email Test";
        String templateName = "bulk-template";
        Context context = new Context();

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html>Bulk Email</html>");

        // When
        emailService.sendBulkEmail(recipients, subject, templateName, context);

        // Then
        verify(emailSender, times(3)).send(mimeMessage);
        verify(templateEngine, times(3)).process(eq(templateName), any(Context.class));
    }

    @Test
    void sendBulkEmail_WhenOneEmailFails_ShouldContinueWithOthers() {
        // Given
        String[] recipients = {"user1@example.com", "user2@example.com"};
        String subject = "Bulk Email Test";
        String templateName = "bulk-template";
        Context context = new Context();

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html>Bulk Email</html>");

        // Make the first email fail, but second should succeed
        doThrow(new RuntimeException("Failed to send"))
                .doNothing()
                .when(emailSender).send(mimeMessage);

        // When
        emailService.sendBulkEmail(recipients, subject, templateName, context);

        // Then
        verify(emailSender, times(2)).send(mimeMessage);
        verify(templateEngine, times(2)).process(eq(templateName), any(Context.class));
    }

    @Test
    void sendAdminNotification_ShouldSendNotificationToAdmins() {
        // Given
        String subject = "Admin Alert";
        String message = "System alert message";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("admin-notification"), any(Context.class))).thenReturn("<html>Admin Notification</html>");

        // When
        emailService.sendAdminNotification(subject, message);

        // Then
        verify(templateEngine).process(eq("admin-notification"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendTestEmail_ShouldSendTestEmail() {
        // Given
        String to = "test@example.com";
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("test-email"), any(Context.class))).thenReturn("<html>Test Email</html>");

        // When
        emailService.sendTestEmail(to);

        // Then
        verify(templateEngine).process(eq("test-email"), any(Context.class));
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void sendCustomEmail_ShouldSendEmailWithCustomVariables() {
        // Given
        String to = "custom@example.com";
        String subject = "Custom Email";
        String templateName = "custom-template";
        Map<String, Object> variables = new HashMap<>();
        variables.put("customVar1", "value1");
        variables.put("customVar2", "value2");

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq(templateName), any(Context.class))).thenReturn("<html>Custom Email</html>");

        // When
        emailService.sendCustomEmail(to, subject, templateName, variables);

        // Then
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine).process(eq(templateName), contextCaptor.capture());

        Context capturedContext = contextCaptor.getValue();
        // Verify that default and custom variables are present
        assertTrue(capturedContext.getVariableNames().contains("appName"));
        assertTrue(capturedContext.getVariableNames().contains("appUrl"));
        assertTrue(capturedContext.getVariableNames().contains("currentDate"));

        verify(emailSender).send(mimeMessage);
    }

    @Test
    void getEmailStatistics_ShouldReturnStatistics() {
        // When
        EmailService.EmailStatistics stats = emailService.getEmailStatistics();

        // Then
        assertNotNull(stats);
        assertEquals(0L, stats.getTotalEmailsSent());
        assertEquals(0L, stats.getTotalEmailsFailed());
        assertEquals(0L, stats.getTotalEmailsToday());
    }

    @Test
    void sendHtmlEmail_WhenMimeMessageHelperThrowsException_ShouldThrowRuntimeException() throws MessagingException {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html>Test</html>");

        // Simulate exception when sending the email
        doThrow(new RuntimeException("Failed to send HTML email")).when(emailSender).send(mimeMessage);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                emailService.sendHtmlEmail("test@example.com", "Subject", "template", new Context())
        );

        assertEquals("Failed to send HTML email", exception.getMessage());
    }

    // Removed the test methods for methods that don't exist in the actual EmailService class:
    // - sendPasswordResetEmail (line 167)
    // - sendPasswordResetWithNewPassword (line 333)
}