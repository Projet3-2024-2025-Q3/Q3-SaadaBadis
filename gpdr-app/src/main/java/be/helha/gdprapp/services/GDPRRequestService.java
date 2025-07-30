package be.helha.gdprapp.services;

import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.repositories.GDPRRequestRepository;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.repositories.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GDPRRequestService {

    @Autowired
    private GDPRRequestRepository gdprRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EmailService emailService;

    // Constants for request types and statuses
    public static final String REQUEST_TYPE_MODIFICATION = "MODIFICATION";
    public static final String REQUEST_TYPE_DELETION = "DELETION";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSED = "PROCESSED";

    /**
     * Get all GDPR requests (Admin only)
     * @return List of all GDPR requests
     */
    public List<GDPRRequest> getAllGDPRRequests() {
        return gdprRequestRepository.findAll();
    }

    /**
     * Get GDPR request by ID
     * @param id Request ID
     * @return Optional containing the request if found
     */
    public Optional<GDPRRequest> getGDPRRequestById(Integer id) {
        return gdprRequestRepository.findById(id);
    }

    /**
     * UC1 - Client: Get user's own GDPR requests
     * @param userId User ID
     * @return List of user's GDPR requests
     */
    public List<GDPRRequest> getUserGDPRRequests(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return gdprRequestRepository.findByUserOrderByRequestDateDesc(user);
    }

    /**
     * UC1 - Client: Get user's own GDPR requests by email
     * @param email User email
     * @return List of user's GDPR requests
     */
    public List<GDPRRequest> getUserGDPRRequestsByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return gdprRequestRepository.findByUserOrderByRequestDateDesc(user);
    }

    /**
     * UC2 - Manager: Get company's GDPR requests
     * @param companyId Company ID
     * @return List of company's GDPR requests
     */
    public List<GDPRRequest> getCompanyGDPRRequests(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
        return gdprRequestRepository.findByCompanyOrderByRequestDateDesc(company);
    }

    /**
     * UC2 - Manager: Get pending requests for company
     * @param companyId Company ID
     * @return List of pending GDPR requests for company
     */
    public List<GDPRRequest> getCompanyPendingRequests(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
        return gdprRequestRepository.findByCompanyAndStatus(company, STATUS_PENDING);
    }

    /**
     * Create a new GDPR request
     * @param gdprRequest GDPR request to create
     * @return Created GDPR request
     */
    public GDPRRequest createGDPRRequest(GDPRRequest gdprRequest) {
        // Validate input
        if (gdprRequest.getRequestType() == null || gdprRequest.getRequestType().trim().isEmpty()) {
            throw new RuntimeException("Request type cannot be null or empty");
        }

        if (gdprRequest.getUser() == null || gdprRequest.getUser().getIdUser() == null) {
            throw new RuntimeException("User cannot be null");
        }

        if (gdprRequest.getCompany() == null || gdprRequest.getCompany().getIdCompany() == null) {
            throw new RuntimeException("Company cannot be null");
        }

        // Validate request type
        if (!REQUEST_TYPE_MODIFICATION.equals(gdprRequest.getRequestType()) &&
                !REQUEST_TYPE_DELETION.equals(gdprRequest.getRequestType())) {
            throw new RuntimeException("Invalid request type. Must be MODIFICATION or DELETION");
        }

        // Verify that user and company exist
        User user = userRepository.findById(gdprRequest.getUser().getIdUser())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Company company = companyRepository.findById(gdprRequest.getCompany().getIdCompany())
                .orElseThrow(() -> new RuntimeException("Company not found"));

        // Set default values
        gdprRequest.setUser(user);
        gdprRequest.setCompany(company);
        gdprRequest.setStatus(STATUS_PENDING);
        gdprRequest.setRequestDate(LocalDateTime.now());

        // Trim request content
        if (gdprRequest.getRequestContent() != null) {
            gdprRequest.setRequestContent(gdprRequest.getRequestContent().trim());
        }

        // Save the request
        GDPRRequest savedRequest = gdprRequestRepository.save(gdprRequest);

        // Send confirmation email to user
        try {
            emailService.sendGDPRRequestConfirmation(user, savedRequest);
        } catch (Exception e) {
            // Log the error but don't fail the request creation
            System.err.println("Failed to send confirmation email: " + e.getMessage());
        }

        // Send notification email to company
        try {
            emailService.sendGDPRRequestNotification(company, savedRequest);
        } catch (Exception e) {
            // Log the error but don't fail the request creation
            System.err.println("Failed to send notification email: " + e.getMessage());
        }

        return savedRequest;
    }

    /**
     * Update GDPR request status (Manager/Admin only)
     * @param requestId Request ID
     * @param newStatus New status
     * @return Updated GDPR request
     */
    public GDPRRequest updateRequestStatus(Integer requestId, String newStatus) {
        GDPRRequest request = gdprRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("GDPR request not found with id: " + requestId));

        // Validate status
        if (!STATUS_PENDING.equals(newStatus) && !STATUS_PROCESSED.equals(newStatus)) {
            throw new RuntimeException("Invalid status. Must be PENDING or PROCESSED");
        }

        String oldStatus = request.getStatus();
        request.setStatus(newStatus);

        GDPRRequest updatedRequest = gdprRequestRepository.save(request);

        // Send status update email to user
        try {
            emailService.sendGDPRRequestStatusUpdate(request.getUser(), updatedRequest, oldStatus);
        } catch (Exception e) {
            // Log the error but don't fail the status update
            System.err.println("Failed to send status update email: " + e.getMessage());
        }

        return updatedRequest;
    }

    /**
     * Update GDPR request content
     * @param requestId Request ID
     * @param newContent New content
     * @return Updated GDPR request
     */
    public GDPRRequest updateRequestContent(Integer requestId, String newContent) {
        GDPRRequest request = gdprRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("GDPR request not found with id: " + requestId));

        // Only allow content update if request is still pending
        if (!STATUS_PENDING.equals(request.getStatus())) {
            throw new RuntimeException("Cannot update content of processed request");
        }

        if (newContent != null) {
            request.setRequestContent(newContent.trim());
        }

        return gdprRequestRepository.save(request);
    }

    /**
     * Delete GDPR request (Admin only or user's own pending request)
     * @param requestId Request ID
     */
    public void deleteGDPRRequest(Integer requestId) {
        if (!gdprRequestRepository.existsById(requestId)) {
            throw new RuntimeException("GDPR request not found with id: " + requestId);
        }

        gdprRequestRepository.deleteById(requestId);
    }

    /**
     * Get requests by status
     * @param status Request status
     * @return List of requests with the given status
     */
    public List<GDPRRequest> getRequestsByStatus(String status) {
        return gdprRequestRepository.findByStatusOrderByRequestDateDesc(status);
    }

    /**
     * Get requests by type
     * @param requestType Request type
     * @return List of requests with the given type
     */
    public List<GDPRRequest> getRequestsByType(String requestType) {
        return gdprRequestRepository.findByRequestType(requestType);
    }

    /**
     * Get user's requests by status
     * @param userId User ID
     * @param status Request status
     * @return List of user's requests with the given status
     */
    public List<GDPRRequest> getUserRequestsByStatus(Integer userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return gdprRequestRepository.findByUserAndStatus(user, status);
    }

    /**
     * Get requests between dates
     * @param startDate Start date
     * @param endDate End date
     * @return List of requests between the given dates
     */
    public List<GDPRRequest> getRequestsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("Start date cannot be after end date");
        }
        return gdprRequestRepository.findByRequestDateBetween(startDate, endDate);
    }

    /**
     * Get recent requests (last 30 days)
     * @return List of recent GDPR requests
     */
    public List<GDPRRequest> getRecentRequests() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return gdprRequestRepository.findRecentRequests(thirtyDaysAgo);
    }

    /**
     * Count requests by status
     * @param status Request status
     * @return Number of requests with the given status
     */
    public long countRequestsByStatus(String status) {
        return gdprRequestRepository.countByStatus(status);
    }

    /**
     * Count requests by company
     * @param companyId Company ID
     * @return Number of requests for the given company
     */
    public long countRequestsByCompany(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
        return gdprRequestRepository.countByCompany(company);
    }

    /**
     * Get GDPR request statistics
     * @return GDPRRequestStatistics object
     */
    public GDPRRequestStatistics getGDPRRequestStatistics() {
        long totalRequests = gdprRequestRepository.count();
        long pendingRequests = countRequestsByStatus(STATUS_PENDING);
        long processedRequests = countRequestsByStatus(STATUS_PROCESSED);
        long modificationRequests = gdprRequestRepository.findByRequestType(REQUEST_TYPE_MODIFICATION).size();
        long deletionRequests = gdprRequestRepository.findByRequestType(REQUEST_TYPE_DELETION).size();

        return new GDPRRequestStatistics(totalRequests, pendingRequests, processedRequests,
                modificationRequests, deletionRequests);
    }

    /**
     * Check if user can access request (owns it or is admin/manager)
     * @param requestId Request ID
     * @param userId User ID
     * @return true if user can access the request
     */
    public boolean canUserAccessRequest(Integer requestId, Integer userId) {
        Optional<GDPRRequest> requestOpt = gdprRequestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            return false;
        }

        GDPRRequest request = requestOpt.get();
        return request.getUser().getIdUser().equals(userId);
    }

    /**
     * Validate request type
     * @param requestType Request type to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidRequestType(String requestType) {
        return REQUEST_TYPE_MODIFICATION.equals(requestType) || REQUEST_TYPE_DELETION.equals(requestType);
    }

    /**
     * Validate request status
     * @param status Status to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidStatus(String status) {
        return STATUS_PENDING.equals(status) || STATUS_PROCESSED.equals(status);
    }

    /**
     * Get all valid request types
     * @return List of valid request types
     */
    public List<String> getValidRequestTypes() {
        List<String> types = new ArrayList<String>();
        types.add(REQUEST_TYPE_MODIFICATION);
        types.add(REQUEST_TYPE_DELETION);
        return types;
    }

    /**
     * Get all valid statuses
     * @return List of valid statuses
     */
    public List<String> getValidStatuses() {
        List<String> statuses = new ArrayList<String>();
        statuses.add(STATUS_PENDING);
        statuses.add(STATUS_PROCESSED);
        return statuses;
    }

    /**
     * Inner class for GDPR request statistics
     */
    public static class GDPRRequestStatistics {
        private final long totalRequests;
        private final long pendingRequests;
        private final long processedRequests;
        private final long modificationRequests;
        private final long deletionRequests;

        public GDPRRequestStatistics(long totalRequests, long pendingRequests, long processedRequests,
                                     long modificationRequests, long deletionRequests) {
            this.totalRequests = totalRequests;
            this.pendingRequests = pendingRequests;
            this.processedRequests = processedRequests;
            this.modificationRequests = modificationRequests;
            this.deletionRequests = deletionRequests;
        }

        // Getters
        public long getTotalRequests() { return totalRequests; }
        public long getPendingRequests() { return pendingRequests; }
        public long getProcessedRequests() { return processedRequests; }
        public long getModificationRequests() { return modificationRequests; }
        public long getDeletionRequests() { return deletionRequests; }
    }
}