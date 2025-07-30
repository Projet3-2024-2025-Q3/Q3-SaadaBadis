package be.helha.gdprapp;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.CompanyRepository;
import be.helha.gdprapp.repositories.GDPRRequestRepository;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.services.EmailService;
import be.helha.gdprapp.services.GDPRRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GDPRRequestServiceTest {

    @Mock
    private GDPRRequestRepository gdprRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private GDPRRequestService gdprRequestService;

    private User testUser;
    private Company testCompany;
    private GDPRRequest testGDPRRequest;
    private Role testRole;
    private List<GDPRRequest> testRequests;

    @BeforeEach
    void setUp() {
        // Set up test role
        testRole = new Role();
        testRole.setIdRole(1);
        testRole.setRole("CLIENT");

        // Set up test user
        testUser = new User();
        testUser.setIdUser(1);
        testUser.setFirstname("John");
        testUser.setLastname("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setActive(true);
        testUser.setRole(testRole);

        // Set up test company
        testCompany = new Company();
        testCompany.setIdCompany(1);
        testCompany.setCompanyName("Test Company");
        testCompany.setEmail("contact@testcompany.com");

        // Set up test GDPR request
        testGDPRRequest = new GDPRRequest();
        testGDPRRequest.setIdRequest(1);
        testGDPRRequest.setRequestType(GDPRRequestService.REQUEST_TYPE_DELETION);
        testGDPRRequest.setStatus(GDPRRequestService.STATUS_PENDING);
        testGDPRRequest.setRequestDate(LocalDateTime.now());
        testGDPRRequest.setRequestContent("Please delete my data");
        testGDPRRequest.setUser(testUser);
        testGDPRRequest.setCompany(testCompany);

        // Set up test requests list
        testRequests = new ArrayList<>();
        testRequests.add(testGDPRRequest);
    }

    @Test
    void getAllGDPRRequests_ShouldReturnAllRequests() {
        // Given
        when(gdprRequestRepository.findAll()).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getAllGDPRRequests();

        // Then
        assertEquals(1, result.size());
        assertEquals(testGDPRRequest.getIdRequest(), result.get(0).getIdRequest());
        verify(gdprRequestRepository).findAll();
    }

    @Test
    void getGDPRRequestById_WhenRequestExists_ShouldReturnRequest() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));

        // When
        Optional<GDPRRequest> result = gdprRequestService.getGDPRRequestById(1);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testGDPRRequest.getIdRequest(), result.get().getIdRequest());
        verify(gdprRequestRepository).findById(1);
    }

    @Test
    void getGDPRRequestById_WhenRequestDoesNotExist_ShouldReturnEmpty() {
        // Given
        when(gdprRequestRepository.findById(999)).thenReturn(Optional.empty());

        // When
        Optional<GDPRRequest> result = gdprRequestService.getGDPRRequestById(999);

        // Then
        assertFalse(result.isPresent());
        verify(gdprRequestRepository).findById(999);
    }

    @Test
    void getUserGDPRRequests_WhenUserExists_ShouldReturnUserRequests() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(gdprRequestRepository.findByUserOrderByRequestDateDesc(testUser)).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getUserGDPRRequests(1);

        // Then
        assertEquals(1, result.size());
        assertEquals(testUser.getIdUser(), result.get(0).getUser().getIdUser());
        verify(userRepository).findById(1);
        verify(gdprRequestRepository).findByUserOrderByRequestDateDesc(testUser);
    }

    @Test
    void getUserGDPRRequests_WhenUserDoesNotExist_ShouldThrowException() {
        // Given
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.getUserGDPRRequests(999)
        );

        assertEquals("User not found with id: 999", exception.getMessage());
        verify(gdprRequestRepository, never()).findByUserOrderByRequestDateDesc(any());
    }

    @Test
    void getUserGDPRRequestsByEmail_WhenUserExists_ShouldReturnUserRequests() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(gdprRequestRepository.findByUserOrderByRequestDateDesc(testUser)).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getUserGDPRRequestsByEmail("john.doe@example.com");

        // Then
        assertEquals(1, result.size());
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(gdprRequestRepository).findByUserOrderByRequestDateDesc(testUser);
    }

    @Test
    void getCompanyGDPRRequests_WhenCompanyExists_ShouldReturnCompanyRequests() {
        // Given
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(gdprRequestRepository.findByCompanyOrderByRequestDateDesc(testCompany)).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getCompanyGDPRRequests(1);

        // Then
        assertEquals(1, result.size());
        assertEquals(testCompany.getIdCompany(), result.get(0).getCompany().getIdCompany());
        verify(companyRepository).findById(1);
        verify(gdprRequestRepository).findByCompanyOrderByRequestDateDesc(testCompany);
    }

    @Test
    void getCompanyPendingRequests_WhenCompanyExists_ShouldReturnPendingRequests() {
        // Given
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(gdprRequestRepository.findByCompanyAndStatus(testCompany, GDPRRequestService.STATUS_PENDING))
                .thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getCompanyPendingRequests(1);

        // Then
        assertEquals(1, result.size());
        verify(companyRepository).findById(1);
        verify(gdprRequestRepository).findByCompanyAndStatus(testCompany, GDPRRequestService.STATUS_PENDING);
    }

    @Test
    void createGDPRRequest_WithValidData_ShouldCreateRequest() {
        // Given
        GDPRRequest newRequest = new GDPRRequest();
        newRequest.setRequestType(GDPRRequestService.REQUEST_TYPE_MODIFICATION);
        newRequest.setRequestContent("Test request");
        newRequest.setUser(testUser);
        newRequest.setCompany(testCompany);

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(gdprRequestRepository.save(any(GDPRRequest.class))).thenReturn(testGDPRRequest);

        // When
        GDPRRequest result = gdprRequestService.createGDPRRequest(newRequest);

        // Then
        assertNotNull(result);
        verify(gdprRequestRepository).save(any(GDPRRequest.class));
        verify(emailService).sendGDPRRequestConfirmation(testUser, testGDPRRequest);
        verify(emailService).sendGDPRRequestNotification(testCompany, testGDPRRequest);
    }

    @Test
    void createGDPRRequest_WithNullRequestType_ShouldThrowException() {
        // Given
        GDPRRequest invalidRequest = new GDPRRequest();
        invalidRequest.setRequestType(null);
        invalidRequest.setUser(testUser);
        invalidRequest.setCompany(testCompany);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.createGDPRRequest(invalidRequest)
        );

        assertEquals("Request type cannot be null or empty", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }

    @Test
    void createGDPRRequest_WithEmptyRequestType_ShouldThrowException() {
        // Given
        GDPRRequest invalidRequest = new GDPRRequest();
        invalidRequest.setRequestType("   ");
        invalidRequest.setUser(testUser);
        invalidRequest.setCompany(testCompany);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.createGDPRRequest(invalidRequest)
        );

        assertEquals("Request type cannot be null or empty", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }



    @Test
    void createGDPRRequest_WithNullUser_ShouldThrowException() {
        // Given
        GDPRRequest invalidRequest = new GDPRRequest();
        invalidRequest.setRequestType(GDPRRequestService.REQUEST_TYPE_DELETION);
        invalidRequest.setUser(null);
        invalidRequest.setCompany(testCompany);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.createGDPRRequest(invalidRequest)
        );

        assertEquals("User cannot be null", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }

    @Test
    void createGDPRRequest_WithEmailServiceFailure_ShouldStillCreateRequest() {
        // Given
        GDPRRequest newRequest = new GDPRRequest();
        newRequest.setRequestType(GDPRRequestService.REQUEST_TYPE_DELETION);
        newRequest.setUser(testUser);
        newRequest.setCompany(testCompany);

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(gdprRequestRepository.save(any(GDPRRequest.class))).thenReturn(testGDPRRequest);
        doThrow(new RuntimeException("Email service error")).when(emailService)
                .sendGDPRRequestConfirmation(any(User.class), any(GDPRRequest.class));

        // When
        GDPRRequest result = gdprRequestService.createGDPRRequest(newRequest);

        // Then
        assertNotNull(result);
        verify(gdprRequestRepository).save(any(GDPRRequest.class));
        verify(emailService).sendGDPRRequestConfirmation(testUser, testGDPRRequest);
        verify(emailService).sendGDPRRequestNotification(testCompany, testGDPRRequest);
    }

    @Test
    void updateRequestStatus_WithValidData_ShouldUpdateStatus() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));
        when(gdprRequestRepository.save(any(GDPRRequest.class))).thenReturn(testGDPRRequest);

        // When
        GDPRRequest result = gdprRequestService.updateRequestStatus(1, GDPRRequestService.STATUS_PROCESSED);

        // Then
        assertNotNull(result);
        verify(gdprRequestRepository).save(testGDPRRequest);
        verify(emailService).sendGDPRRequestStatusUpdate(eq(testUser), eq(testGDPRRequest), eq(GDPRRequestService.STATUS_PENDING));
    }

    @Test
    void updateRequestStatus_WhenRequestNotFound_ShouldThrowException() {
        // Given
        when(gdprRequestRepository.findById(999)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.updateRequestStatus(999, GDPRRequestService.STATUS_PROCESSED)
        );

        assertEquals("GDPR request not found with id: 999", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }

    @Test
    void updateRequestStatus_WithInvalidStatus_ShouldThrowException() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.updateRequestStatus(1, "INVALID_STATUS")
        );

        assertEquals("Invalid status. Must be PENDING or PROCESSED", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }

    @Test
    void updateRequestContent_WithValidData_ShouldUpdateContent() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));
        when(gdprRequestRepository.save(any(GDPRRequest.class))).thenReturn(testGDPRRequest);

        // When
        GDPRRequest result = gdprRequestService.updateRequestContent(1, "Updated content");

        // Then
        assertNotNull(result);
        verify(gdprRequestRepository).save(testGDPRRequest);
    }

    @Test
    void updateRequestContent_WhenRequestIsProcessed_ShouldThrowException() {
        // Given
        testGDPRRequest.setStatus(GDPRRequestService.STATUS_PROCESSED);
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.updateRequestContent(1, "Updated content")
        );

        assertEquals("Cannot update content of processed request", exception.getMessage());
        verify(gdprRequestRepository, never()).save(any(GDPRRequest.class));
    }

    @Test
    void deleteGDPRRequest_WhenRequestExists_ShouldDeleteRequest() {
        // Given
        when(gdprRequestRepository.existsById(1)).thenReturn(true);

        // When
        gdprRequestService.deleteGDPRRequest(1);

        // Then
        verify(gdprRequestRepository).deleteById(1);
    }

    @Test
    void deleteGDPRRequest_WhenRequestDoesNotExist_ShouldThrowException() {
        // Given
        when(gdprRequestRepository.existsById(999)).thenReturn(false);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.deleteGDPRRequest(999)
        );

        assertEquals("GDPR request not found with id: 999", exception.getMessage());
        verify(gdprRequestRepository, never()).deleteById(999);
    }

    @Test
    void getRequestsByStatus_ShouldReturnFilteredRequests() {
        // Given
        when(gdprRequestRepository.findByStatusOrderByRequestDateDesc(GDPRRequestService.STATUS_PENDING))
                .thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getRequestsByStatus(GDPRRequestService.STATUS_PENDING);

        // Then
        assertEquals(1, result.size());
        verify(gdprRequestRepository).findByStatusOrderByRequestDateDesc(GDPRRequestService.STATUS_PENDING);
    }

    @Test
    void getRequestsByType_ShouldReturnFilteredRequests() {
        // Given
        when(gdprRequestRepository.findByRequestType(GDPRRequestService.REQUEST_TYPE_DELETION))
                .thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getRequestsByType(GDPRRequestService.REQUEST_TYPE_DELETION);

        // Then
        assertEquals(1, result.size());
        verify(gdprRequestRepository).findByRequestType(GDPRRequestService.REQUEST_TYPE_DELETION);
    }

    @Test
    void getUserRequestsByStatus_WhenUserExists_ShouldReturnFilteredRequests() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(gdprRequestRepository.findByUserAndStatus(testUser, GDPRRequestService.STATUS_PENDING))
                .thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getUserRequestsByStatus(1, GDPRRequestService.STATUS_PENDING);

        // Then
        assertEquals(1, result.size());
        verify(userRepository).findById(1);
        verify(gdprRequestRepository).findByUserAndStatus(testUser, GDPRRequestService.STATUS_PENDING);
    }

    @Test
    void getRequestsBetweenDates_WithValidDates_ShouldReturnRequests() {
        // Given
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        LocalDateTime endDate = LocalDateTime.now();
        when(gdprRequestRepository.findByRequestDateBetween(startDate, endDate)).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getRequestsBetweenDates(startDate, endDate);

        // Then
        assertEquals(1, result.size());
        verify(gdprRequestRepository).findByRequestDateBetween(startDate, endDate);
    }

    @Test
    void getRequestsBetweenDates_WhenStartDateAfterEndDate_ShouldThrowException() {
        // Given
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().minusDays(7);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                gdprRequestService.getRequestsBetweenDates(startDate, endDate)
        );

        assertEquals("Start date cannot be after end date", exception.getMessage());
        verify(gdprRequestRepository, never()).findByRequestDateBetween(any(), any());
    }

    @Test
    void getRecentRequests_ShouldReturnRecentRequests() {
        // Given
        when(gdprRequestRepository.findRecentRequests(any(LocalDateTime.class))).thenReturn(testRequests);

        // When
        List<GDPRRequest> result = gdprRequestService.getRecentRequests();

        // Then
        assertEquals(1, result.size());
        verify(gdprRequestRepository).findRecentRequests(any(LocalDateTime.class));
    }

    @Test
    void countRequestsByStatus_ShouldReturnCount() {
        // Given
        when(gdprRequestRepository.countByStatus(GDPRRequestService.STATUS_PENDING)).thenReturn(5L);

        // When
        long result = gdprRequestService.countRequestsByStatus(GDPRRequestService.STATUS_PENDING);

        // Then
        assertEquals(5L, result);
        verify(gdprRequestRepository).countByStatus(GDPRRequestService.STATUS_PENDING);
    }

    @Test
    void countRequestsByCompany_WhenCompanyExists_ShouldReturnCount() {
        // Given
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(gdprRequestRepository.countByCompany(testCompany)).thenReturn(3L);

        // When
        long result = gdprRequestService.countRequestsByCompany(1);

        // Then
        assertEquals(3L, result);
        verify(companyRepository).findById(1);
        verify(gdprRequestRepository).countByCompany(testCompany);
    }

    @Test
    void getGDPRRequestStatistics_ShouldReturnStatistics() {
        // Given
        when(gdprRequestRepository.count()).thenReturn(10L);
        when(gdprRequestRepository.countByStatus(GDPRRequestService.STATUS_PENDING)).thenReturn(6L);
        when(gdprRequestRepository.countByStatus(GDPRRequestService.STATUS_PROCESSED)).thenReturn(4L);
        when(gdprRequestRepository.findByRequestType(GDPRRequestService.REQUEST_TYPE_MODIFICATION)).thenReturn(testRequests);
        when(gdprRequestRepository.findByRequestType(GDPRRequestService.REQUEST_TYPE_DELETION)).thenReturn(testRequests);

        // When
        GDPRRequestService.GDPRRequestStatistics stats = gdprRequestService.getGDPRRequestStatistics();

        // Then
        assertNotNull(stats);
        assertEquals(10L, stats.getTotalRequests());
        assertEquals(6L, stats.getPendingRequests());
        assertEquals(4L, stats.getProcessedRequests());
        assertEquals(1L, stats.getModificationRequests());
        assertEquals(1L, stats.getDeletionRequests());
    }

    @Test
    void canUserAccessRequest_WhenUserOwnsRequest_ShouldReturnTrue() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));

        // When
        boolean result = gdprRequestService.canUserAccessRequest(1, 1);

        // Then
        assertTrue(result);
        verify(gdprRequestRepository).findById(1);
    }

    @Test
    void canUserAccessRequest_WhenUserDoesNotOwnRequest_ShouldReturnFalse() {
        // Given
        when(gdprRequestRepository.findById(1)).thenReturn(Optional.of(testGDPRRequest));

        // When
        boolean result = gdprRequestService.canUserAccessRequest(1, 999);

        // Then
        assertFalse(result);
        verify(gdprRequestRepository).findById(1);
    }

    @Test
    void canUserAccessRequest_WhenRequestDoesNotExist_ShouldReturnFalse() {
        // Given
        when(gdprRequestRepository.findById(999)).thenReturn(Optional.empty());

        // When
        boolean result = gdprRequestService.canUserAccessRequest(999, 1);

        // Then
        assertFalse(result);
        verify(gdprRequestRepository).findById(999);
    }

    @Test
    void isValidRequestType_WithValidTypes_ShouldReturnTrue() {
        // When & Then
        assertTrue(gdprRequestService.isValidRequestType(GDPRRequestService.REQUEST_TYPE_MODIFICATION));
        assertTrue(gdprRequestService.isValidRequestType(GDPRRequestService.REQUEST_TYPE_DELETION));
    }

    @Test
    void isValidRequestType_WithInvalidType_ShouldReturnFalse() {
        // When & Then
        assertFalse(gdprRequestService.isValidRequestType("INVALID_TYPE"));
        assertFalse(gdprRequestService.isValidRequestType(null));
    }

    @Test
    void isValidStatus_WithValidStatuses_ShouldReturnTrue() {
        // When & Then
        assertTrue(gdprRequestService.isValidStatus(GDPRRequestService.STATUS_PENDING));
        assertTrue(gdprRequestService.isValidStatus(GDPRRequestService.STATUS_PROCESSED));
    }

    @Test
    void isValidStatus_WithInvalidStatus_ShouldReturnFalse() {
        // When & Then
        assertFalse(gdprRequestService.isValidStatus("INVALID_STATUS"));
        assertFalse(gdprRequestService.isValidStatus(null));
    }

    @Test
    void getValidRequestTypes_ShouldReturnAllValidTypes() {
        // When
        List<String> result = gdprRequestService.getValidRequestTypes();

        // Then
        assertEquals(2, result.size());
        assertTrue(result.contains(GDPRRequestService.REQUEST_TYPE_MODIFICATION));
        assertTrue(result.contains(GDPRRequestService.REQUEST_TYPE_DELETION));
    }

    @Test
    void getValidStatuses_ShouldReturnAllValidStatuses() {
        // When
        List<String> result = gdprRequestService.getValidStatuses();

        // Then
        assertEquals(2, result.size());
        assertTrue(result.contains(GDPRRequestService.STATUS_PENDING));
        assertTrue(result.contains(GDPRRequestService.STATUS_PROCESSED));
    }
}