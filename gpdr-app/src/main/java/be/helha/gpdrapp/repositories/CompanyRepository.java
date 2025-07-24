package be.helha.gpdrapp.repositories;

import be.helha.gpdrapp.models.Company;
import org.springframework.data.jpa.repository.JpaRepository;
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

    // Find companies by name containing (for search)
    List<Company> findByCompanyNameContainingIgnoreCase(String companyName);

    // Find all companies ordered by name
    List<Company> findAllByOrderByCompanyNameAsc();
}