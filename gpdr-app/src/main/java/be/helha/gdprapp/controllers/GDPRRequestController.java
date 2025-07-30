package be.helha.gdprapp.controllers;

import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.services.GDPRRequestService;
import be.helha.gdprapp.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gdpr-requests")
@CrossOrigin(origins = "*")
@Tag(name = "GDPR Request", description = "GDPR request management APIs")
public class GDPRRequestController {

    @Autowired
    private GDPRRequestService gdprRequestService;

    @Autowired
    private UserService userService;

    // Get all GDPR requests (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all GDPR requests", description = "Retrieve all GDPR requests (Admin only)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getAllGDPRRequests() {
        List<GDPRRequest> requests = gdprRequestService.getAllGDPRRequests();
        return ResponseEntity.ok(requests);
    }

    // Get GDPR request by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @gdprRequestService.canUserAccessRequest(#id, @userService.getCurrentUser().idUser)")
    @Operation(summary = "Get GDPR request by ID", description = "Retrieve a GDPR request by its ID",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<GDPRRequest> getGDPRRequestById(@PathVariable Integer id) {
        Optional<GDPRRequest> request = gdprRequestService.getGDPRRequestById(id);
        return request.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UC1 - Client: Get current user's GDPR requests
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    @Operation(summary = "Get current user's GDPR requests", description = "UC1 - Client can view their own GDPR requests",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getMyGDPRRequests(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<GDPRRequest> requests = gdprRequestService.getUserGDPRRequestsByEmail(userEmail);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // UC1 - Get user's GDPR requests by user ID (Admin only)
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user's GDPR requests", description = "Get GDPR requests for a specific user (Admin only)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getUserGDPRRequests(@PathVariable Integer userId) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getUserGDPRRequests(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(null);
        }
    }

    // UC2 - Manager: Get company's GDPR requests
    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get company's GDPR requests", description = "UC2 - Manager can view requests for their company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getCompanyGDPRRequests(@PathVariable Integer companyId) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getCompanyGDPRRequests(companyId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(null);
        }
    }

    // UC2 - Manager: Get company's pending requests
    @GetMapping("/company/{companyId}/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get company's pending GDPR requests", description = "UC2 - Manager can view pending requests for their company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getCompanyPendingRequests(@PathVariable Integer companyId) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getCompanyPendingRequests(companyId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(null);
        }
    }

    // Create new GDPR request
    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    @Operation(summary = "Create new GDPR request", description = "Create a new GDPR request",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> createGDPRRequest(@RequestBody CreateGDPRRequestDTO requestDTO,
                                               Authentication authentication) {
        try {
            // For non-admin users, ensure they can only create requests for themselves
            if (!authentication.getAuthorities().toString().contains("ADMIN")) {
                String currentUserEmail = authentication.getName();
                // Here you would verify that the user in the request matches the authenticated user
                // This is a simplified version - you might want to add more validation
            }

            GDPRRequest gdprRequest = new GDPRRequest();
            gdprRequest.setRequestType(requestDTO.getRequestType());
            gdprRequest.setRequestContent(requestDTO.getRequestContent());

            // Set user and company from IDs
            gdprRequest.setUser(new be.helha.gdprapp.models.User());
            gdprRequest.getUser().setIdUser(requestDTO.getUserId());

            gdprRequest.setCompany(new be.helha.gdprapp.models.Company());
            gdprRequest.getCompany().setIdCompany(requestDTO.getCompanyId());

            GDPRRequest savedRequest = gdprRequestService.createGDPRRequest(gdprRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error creating GDPR request: " + e.getMessage()));
        }
    }

    // Update GDPR request status (Manager/Admin only)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Update GDPR request status", description = "Update the status of a GDPR request (Manager/Admin only)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> updateRequestStatus(@PathVariable Integer id,
                                                 @RequestBody UpdateStatusDTO statusDTO) {
        try {
            GDPRRequest updatedRequest = gdprRequestService.updateRequestStatus(id, statusDTO.getStatus());
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error updating request status: " + e.getMessage()));
        }
    }

    // Update GDPR request content (User's own pending requests or Admin)
    @PutMapping("/{id}/content")
    @PreAuthorize("hasRole('ADMIN') or @gdprRequestService.canUserAccessRequest(#id, @userService.getCurrentUser().idUser)")
    @Operation(summary = "Update GDPR request content", description = "Update the content of a GDPR request",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> updateRequestContent(@PathVariable Integer id,
                                                  @RequestBody UpdateContentDTO contentDTO) {
        try {
            GDPRRequest updatedRequest = gdprRequestService.updateRequestContent(id, contentDTO.getContent());
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error updating request content: " + e.getMessage()));
        }
    }

    // Delete GDPR request
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @gdprRequestService.canUserAccessRequest(#id, @userService.getCurrentUser().idUser)")
    @Operation(summary = "Delete GDPR request", description = "Delete a GDPR request",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> deleteGDPRRequest(@PathVariable Integer id) {
        try {
            gdprRequestService.deleteGDPRRequest(id);
            return ResponseEntity.ok().body(new SuccessResponse("GDPR request deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error deleting GDPR request: " + e.getMessage()));
        }
    }

    // Get requests by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get requests by status", description = "Get GDPR requests filtered by status",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getRequestsByStatus(@PathVariable String status) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getRequestsByStatus(status);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Get requests by type
    @GetMapping("/type/{requestType}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get requests by type", description = "Get GDPR requests filtered by type",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getRequestsByType(@PathVariable String requestType) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getRequestsByType(requestType);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Get user's requests by status
    @GetMapping("/my-requests/status/{status}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    @Operation(summary = "Get current user's requests by status", description = "Get current user's GDPR requests filtered by status",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getMyRequestsByStatus(@PathVariable String status,
                                                                   Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            be.helha.gdprapp.models.User user = userService.getUserByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<GDPRRequest> requests = gdprRequestService.getUserRequestsByStatus(user.getIdUser(), status);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Get requests between dates
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get requests between dates", description = "Get GDPR requests within a date range",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getRequestsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<GDPRRequest> requests = gdprRequestService.getRequestsBetweenDates(startDate, endDate);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Get recent requests (last 30 days)
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get recent requests", description = "Get GDPR requests from the last 30 days",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<GDPRRequest>> getRecentRequests() {
        List<GDPRRequest> requests = gdprRequestService.getRecentRequests();
        return ResponseEntity.ok(requests);
    }

    // Get request count by status
    @GetMapping("/count/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Count requests by status", description = "Get the count of requests for a specific status",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Long> countRequestsByStatus(@PathVariable String status) {
        long count = gdprRequestService.countRequestsByStatus(status);
        return ResponseEntity.ok(count);
    }

    // Get request count by company
    @GetMapping("/count/company/{companyId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Count requests by company", description = "Get the count of requests for a specific company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Long> countRequestsByCompany(@PathVariable Integer companyId) {
        try {
            long count = gdprRequestService.countRequestsByCompany(companyId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(0L);
        }
    }

    // Get GDPR request statistics
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get GDPR request statistics", description = "Get comprehensive statistics about GDPR requests",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<GDPRRequestService.GDPRRequestStatistics> getGDPRRequestStatistics() {
        GDPRRequestService.GDPRRequestStatistics stats = gdprRequestService.getGDPRRequestStatistics();
        return ResponseEntity.ok(stats);
    }

    // Get valid request types
    @GetMapping("/valid-types")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get valid request types", description = "Get all valid GDPR request types",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<String>> getValidRequestTypes() {
        List<String> types = gdprRequestService.getValidRequestTypes();
        return ResponseEntity.ok(types);
    }

    // Get valid statuses
    @GetMapping("/valid-statuses")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get valid statuses", description = "Get all valid GDPR request statuses",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<String>> getValidStatuses() {
        List<String> statuses = gdprRequestService.getValidStatuses();
        return ResponseEntity.ok(statuses);
    }

    // Validate request type
    @GetMapping("/validate/type/{requestType}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Validate request type", description = "Check if a request type is valid",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> validateRequestType(@PathVariable String requestType) {
        boolean isValid = gdprRequestService.isValidRequestType(requestType);
        return ResponseEntity.ok(isValid);
    }

    // Validate status
    @GetMapping("/validate/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Validate status", description = "Check if a status is valid",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> validateStatus(@PathVariable String status) {
        boolean isValid = gdprRequestService.isValidStatus(status);
        return ResponseEntity.ok(isValid);
    }

    // Inner classes for DTOs
    public static class CreateGDPRRequestDTO {
        private String requestType;
        private String requestContent;
        private Integer userId;
        private Integer companyId;

        // Getters and setters
        public String getRequestType() { return requestType; }
        public void setRequestType(String requestType) { this.requestType = requestType; }
        public String getRequestContent() { return requestContent; }
        public void setRequestContent(String requestContent) { this.requestContent = requestContent; }
        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
        public Integer getCompanyId() { return companyId; }
        public void setCompanyId(Integer companyId) { this.companyId = companyId; }
    }

    public static class UpdateStatusDTO {
        private String status;

        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class UpdateContentDTO {
        private String content;

        // Getters and setters
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class ErrorResponse {
        private String message;
        private String status = "error";

        public ErrorResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class SuccessResponse {
        private String message;
        private String status = "success";

        public SuccessResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}