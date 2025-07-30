package be.helha.gdprapp.controllers;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.services.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
@Tag(name = "Company", description = "Company management APIs")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    // Get all companies (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all companies", description = "Retrieve all companies",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Company>> getAllCompanies() {
        List<Company> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }

    // Get company by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get company by ID", description = "Retrieve a company by its ID",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Company> getCompanyById(@PathVariable Integer id) {
        Optional<Company> company = companyService.getCompanyById(id);
        return company.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get company by email
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get company by email", description = "Retrieve a company by its email",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Company> getCompanyByEmail(@PathVariable String email) {
        Optional<Company> company = companyService.getCompanyByEmail(email);
        return company.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get company by name
    @GetMapping("/name/{companyName}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get company by name", description = "Retrieve a company by its name",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Company> getCompanyByName(@PathVariable String companyName) {
        Optional<Company> company = companyService.getCompanyByName(companyName);
        return company.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create new company (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new company", description = "Create a new company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> createCompany(@RequestBody Company company) {
        try {
            if (companyService.existsByEmail(company.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Company with this email already exists!"));
            }

            if (companyService.existsByName(company.getCompanyName())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Company with this name already exists!"));
            }

            Company savedCompany = companyService.createCompany(company);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCompany);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error creating company: " + e.getMessage()));
        }
    }

    // Update company (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update company", description = "Update an existing company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> updateCompany(@PathVariable Integer id, @RequestBody Company companyDetails) {
        try {
            Optional<Company> existingCompany = companyService.getCompanyById(id);
            if (existingCompany.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Check if email is being changed and if it already exists
            if (!existingCompany.get().getEmail().equals(companyDetails.getEmail())
                    && companyService.existsByEmail(companyDetails.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Company with this email already exists!"));
            }

            // Check if name is being changed and if it already exists
            if (!existingCompany.get().getCompanyName().equals(companyDetails.getCompanyName())
                    && companyService.existsByName(companyDetails.getCompanyName())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Company with this name already exists!"));
            }

            Company updatedCompany = companyService.updateCompany(id, companyDetails);
            return ResponseEntity.ok(updatedCompany);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error updating company: " + e.getMessage()));
        }
    }

    // Delete company (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete company", description = "Delete a company",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> deleteCompany(@PathVariable Integer id) {
        try {
            // Check if company has associated GDPR requests
            if (companyService.hasAssociatedGDPRRequests(id)) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Cannot delete company: It has associated GDPR requests"));
            }

            companyService.deleteCompany(id);
            return ResponseEntity.ok().body(new SuccessResponse("Company deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error deleting company: " + e.getMessage()));
        }
    }

    // Search companies by name
    @GetMapping("/search/name")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search companies by name", description = "Search companies by name (case-insensitive)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Company>> searchCompaniesByName(@RequestParam String name) {
        List<Company> companies = companyService.searchCompaniesByName(name);
        return ResponseEntity.ok(companies);
    }

    // Search companies by email
    @GetMapping("/search/email")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search companies by email", description = "Search companies by email (case-insensitive)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Company>> searchCompaniesByEmail(@RequestParam String email) {
        List<Company> companies = companyService.searchCompaniesByEmail(email);
        return ResponseEntity.ok(companies);
    }

    // Get companies with pagination
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get companies with pagination", description = "Get companies with pagination support",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<Company>> getCompaniesWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Company> companies = companyService.getCompaniesWithPagination(page, size);
        return ResponseEntity.ok(companies);
    }

    // Get companies count
    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get companies count", description = "Get total number of companies",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Long> getCompaniesCount() {
        long count = companyService.getCompaniesCount();
        return ResponseEntity.ok(count);
    }

    // Get company statistics
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get company statistics", description = "Get company statistics",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<CompanyService.CompanyStatistics> getCompanyStatistics() {
        CompanyService.CompanyStatistics stats = companyService.getCompanyStatistics();
        return ResponseEntity.ok(stats);
    }

    // Get all company names (for dropdowns)
    @GetMapping("/names")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get all company names", description = "Get all company names for dropdowns",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<String>> getAllCompanyNames() {
        List<String> companyNames = companyService.getAllCompanyNames();
        return ResponseEntity.ok(companyNames);
    }

    // Get all company emails (for dropdowns)
    @GetMapping("/emails")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    @Operation(summary = "Get all company emails", description = "Get all company emails for dropdowns",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<String>> getAllCompanyEmails() {
        List<String> companyEmails = companyService.getAllCompanyEmails();
        return ResponseEntity.ok(companyEmails);
    }

    // Validate company email
    @GetMapping("/validate/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Validate company email", description = "Check if company email format is valid",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> validateEmail(@PathVariable String email) {
        boolean isValid = companyService.isValidEmail(email);
        return ResponseEntity.ok(isValid);
    }

    // Validate company name
    @GetMapping("/validate/name/{companyName}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Validate company name", description = "Check if company name is valid",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> validateCompanyName(@PathVariable String companyName) {
        boolean isValid = companyService.isValidCompanyName(companyName);
        return ResponseEntity.ok(isValid);
    }

    // Check if company exists by email
    @GetMapping("/exists/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Check if company exists by email", description = "Check if a company with this email exists",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> existsByEmail(@PathVariable String email) {
        boolean exists = companyService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    // Check if company exists by name
    @GetMapping("/exists/name/{companyName}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Check if company exists by name", description = "Check if a company with this name exists",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Boolean> existsByName(@PathVariable String companyName) {
        boolean exists = companyService.existsByName(companyName);
        return ResponseEntity.ok(exists);
    }

    // Create default companies (Admin only)
    @PostMapping("/init-defaults")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create default companies", description = "Create default companies for testing",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> createDefaultCompanies() {
        try {
            List<Company> createdCompanies = companyService.createDefaultCompanies();
            return ResponseEntity.ok().body(new SuccessResponse("Created " + createdCompanies.size() + " default companies"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error creating default companies: " + e.getMessage()));
        }
    }

    // Inner classes for responses
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