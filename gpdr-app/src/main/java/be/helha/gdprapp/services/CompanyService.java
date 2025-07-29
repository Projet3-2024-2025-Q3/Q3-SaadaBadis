package be.helha.gdprapp.services;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.repositories.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    /**
     * Get all companies
     * @return List of all companies
     */
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    /**
     * Get company by ID
     * @param id Company ID
     * @return Optional containing the company if found
     */
    public Optional<Company> getCompanyById(Integer id) {
        return companyRepository.findById(id);
    }

    /**
     * Get company by email
     * @param email Company email
     * @return Optional containing the company if found
     */
    public Optional<Company> getCompanyByEmail(String email) {
        return companyRepository.findByEmail(email);
    }

    /**
     * Get company by name
     * @param companyName Company name
     * @return Optional containing the company if found
     */
    public Optional<Company> getCompanyByName(String companyName) {
        return companyRepository.findByCompanyName(companyName);
    }

    /**
     * Check if a company exists by email
     * @param email Company email
     * @return true if company exists, false otherwise
     */
    public boolean existsByEmail(String email) {
        return companyRepository.existsByEmail(email);
    }

    /**
     * Check if a company exists by name
     * @param companyName Company name
     * @return true if company exists, false otherwise
     */
    public boolean existsByName(String companyName) {
        return companyRepository.existsByCompanyName(companyName);
    }

    /**
     * Create a new company
     * @param company Company to create
     * @return Created company
     * @throws RuntimeException if company with same email or name already exists
     */
    public Company createCompany(Company company) {
        // Validate input
        if (company.getCompanyName() == null || company.getCompanyName().trim().isEmpty()) {
            throw new RuntimeException("Company name cannot be null or empty");
        }

        if (company.getEmail() == null || company.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Company email cannot be null or empty");
        }

        // Check if company already exists by email
        if (existsByEmail(company.getEmail())) {
            throw new RuntimeException("Company with this email already exists");
        }

        // Check if company already exists by name
        if (existsByName(company.getCompanyName())) {
            throw new RuntimeException("Company with this name already exists");
        }

        // Trim whitespace
        company.setCompanyName(company.getCompanyName().trim());
        company.setEmail(company.getEmail().trim().toLowerCase());

        return companyRepository.save(company);
    }

    /**
     * Update an existing company
     * @param id Company ID
     * @param companyDetails Updated company details
     * @return Updated company
     * @throws RuntimeException if company not found or validation fails
     */
    public Company updateCompany(Integer id, Company companyDetails) {
        Company existingCompany = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));

        // Validate input
        if (companyDetails.getCompanyName() == null || companyDetails.getCompanyName().trim().isEmpty()) {
            throw new RuntimeException("Company name cannot be null or empty");
        }

        if (companyDetails.getEmail() == null || companyDetails.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Company email cannot be null or empty");
        }

        // Check if email is being changed and if it already exists
        String newEmail = companyDetails.getEmail().trim().toLowerCase();
        if (!existingCompany.getEmail().equals(newEmail) && existsByEmail(newEmail)) {
            throw new RuntimeException("Company with this email already exists");
        }

        // Check if name is being changed and if it already exists
        String newName = companyDetails.getCompanyName().trim();
        if (!existingCompany.getCompanyName().equals(newName) && existsByName(newName)) {
            throw new RuntimeException("Company with this name already exists");
        }

        // Update company details
        existingCompany.setCompanyName(newName);
        existingCompany.setEmail(newEmail);

        return companyRepository.save(existingCompany);
    }

    /**
     * Delete a company by ID
     * @param id Company ID
     * @throws RuntimeException if company not found
     */
    public void deleteCompany(Integer id) {
        if (!companyRepository.existsById(id)) {
            throw new RuntimeException("Company not found with id: " + id);
        }

        companyRepository.deleteById(id);
    }

    /**
     * Get companies count
     * @return Total number of companies
     */
    public long getCompaniesCount() {
        return companyRepository.count();
    }

    /**
     * Search companies by name (case-insensitive, partial match)
     * @param name Name to search for
     * @return List of companies matching the search criteria
     */
    public List<Company> searchCompaniesByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return getAllCompanies();
        }
        return companyRepository.findByCompanyNameContainingIgnoreCase(name.trim());
    }

    /**
     * Search companies by email (case-insensitive, partial match)
     * @param email Email to search for
     * @return List of companies matching the search criteria
     */
    public List<Company> searchCompaniesByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return getAllCompanies();
        }
        return companyRepository.findByEmailContainingIgnoreCase(email.trim());
    }

    /**
     * Get companies with pagination
     * @param page Page number (0-based)
     * @param size Page size
     * @return Page of companies
     */
    public Page<Company> getCompaniesWithPagination(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return companyRepository.findAll(pageable);
    }

    /**
     * Validate company email format
     * @param email Email to validate
     * @return true if email format is valid, false otherwise
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }

    /**
     * Validate company name
     * @param companyName Company name to validate
     * @return true if company name is valid, false otherwise
     */
    public boolean isValidCompanyName(String companyName) {
        if (companyName == null || companyName.trim().isEmpty()) {
            return false;
        }

        String trimmed = companyName.trim();
        return trimmed.length() >= 2 && trimmed.length() <= 50;
    }

    /**
     * Get all company names (for dropdowns)
     * @return List of company names
     */
    public List<String> getAllCompanyNames() {
        List<Company> companies = companyRepository.findAllByOrderByCompanyNameAsc();
        List<String> companyNames = new ArrayList<String>();

        for (int i = 0; i < companies.size(); i++) {
            companyNames.add(companies.get(i).getCompanyName());
        }

        return companyNames;
    }

    /**
     * Get all company emails (for dropdowns)
     * @return List of company emails
     */
    public List<String> getAllCompanyEmails() {
        List<Company> companies = companyRepository.findAllByOrderByEmailAsc();
        List<String> companyEmails = new ArrayList<String>();

        for (int i = 0; i < companies.size(); i++) {
            companyEmails.add(companies.get(i).getEmail());
        }

        return companyEmails;
    }

    /**
     * Check if company has associated GDPR requests
     * @param companyId Company ID
     * @return true if company has associated GDPR requests, false otherwise
     */
    public boolean hasAssociatedGDPRRequests(Integer companyId) {
        // This would need to be implemented based on your GDPR request repository
        // return gdprRequestRepository.existsByCompanyIdCompany(companyId);
        return false; // Placeholder implementation
    }

    /**
     * Get company statistics
     * @return CompanyStatistics object with various statistics
     */
    public CompanyStatistics getCompanyStatistics() {
        long totalCompanies = getCompaniesCount();

        return new CompanyStatistics(totalCompanies);
    }

    /**
     * Inner class for company statistics
     */
    public static class CompanyStatistics {
        private final long totalCompanies;

        public CompanyStatistics(long totalCompanies) {
            this.totalCompanies = totalCompanies;
        }

        public long getTotalCompanies() {
            return totalCompanies;
        }
    }

    /**
     * Create default companies for testing/initialization
     * @return List of created default companies
     */
    public List<Company> createDefaultCompanies() {
        List<Company> defaultCompanies = new ArrayList<Company>();
        defaultCompanies.add(new Company("Google LLC", "contact@google.com"));
        defaultCompanies.add(new Company("Microsoft Corporation", "contact@microsoft.com"));
        defaultCompanies.add(new Company("Apple Inc.", "contact@apple.com"));
        defaultCompanies.add(new Company("Meta Platforms Inc.", "contact@meta.com"));
        defaultCompanies.add(new Company("Amazon.com Inc.", "contact@amazon.com"));

        List<Company> createdCompanies = new ArrayList<Company>();

        for (int i = 0; i < defaultCompanies.size(); i++) {
            Company company = defaultCompanies.get(i);
            if (!existsByEmail(company.getEmail()) && !existsByName(company.getCompanyName())) {
                createdCompanies.add(createCompany(company));
            }
        }

        return createdCompanies;
    }
}