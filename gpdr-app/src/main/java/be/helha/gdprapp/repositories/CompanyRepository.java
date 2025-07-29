package be.helha.gdprapp.repositories;

import be.helha.gdprapp.models.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

    // Find company by name
    Optional<Company> findByCompanyName(String companyName);

    // Find company by email
    Optional<Company> findByEmail(String email);

    // Check if company exists by name
    boolean existsByCompanyName(String companyName);

    // Check if company exists by email (already inherited from JpaRepository via existsByEmail)
    boolean existsByEmail(String email);

    // Find companies by name containing (for search)
    List<Company> findByCompanyNameContainingIgnoreCase(String companyName);

    // Find companies by email containing (for search) - MÉTHODE AJOUTÉE
    List<Company> findByEmailContainingIgnoreCase(String email);

    // Find all companies ordered by name
    List<Company> findAllByOrderByCompanyNameAsc();

    // Find all companies ordered by email
    List<Company> findAllByOrderByEmailAsc();

    // Custom query to count companies with GDPR requests (if needed later)
    @Query("SELECT COUNT(DISTINCT c) FROM Company c LEFT JOIN GDPRRequest g ON c.idCompany = g.company.idCompany WHERE g.idRequest IS NOT NULL")
    long countCompaniesWithGDPRRequests();

    // Custom query to find companies without GDPR requests (if needed later)
    @Query("SELECT c FROM Company c LEFT JOIN GDPRRequest g ON c.idCompany = g.company.idCompany WHERE g.idRequest IS NULL")
    List<Company> findCompaniesWithoutGDPRRequests();

    // Find companies by name or email containing (for general search)
    @Query("SELECT c FROM Company c WHERE LOWER(c.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Company> findByCompanyNameOrEmailContainingIgnoreCase(@Param("searchTerm") String searchTerm);

    // Count companies by name pattern
    long countByCompanyNameContainingIgnoreCase(String companyName);

    // Count companies by email pattern
    long countByEmailContainingIgnoreCase(String email);
}