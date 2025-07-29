package be.helha.gdprapp.repositories;

import be.helha.gdprapp.models.GDPRRequest;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.models.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GDPRRequestRepository extends JpaRepository<GDPRRequest, Integer> {

    // UC1 - Client: View own requests
    List<GDPRRequest> findByUser(User user);

    // UC1 - Client: View own requests ordered by date (most recent first)
    List<GDPRRequest> findByUserOrderByRequestDateDesc(User user);

    // UC2 - Manager: View requests for company
    List<GDPRRequest> findByCompany(Company company);

    // UC2 - Manager: View requests for company ordered by date
    List<GDPRRequest> findByCompanyOrderByRequestDateDesc(Company company);

    // Filter by status
    List<GDPRRequest> findByStatus(String status);

    // Pending requests for a company (UC2)
    List<GDPRRequest> findByCompanyAndStatus(Company company, String status);

    // History of processed requests ordered by date
    List<GDPRRequest> findByStatusOrderByRequestDateDesc(String status);

    // Find by request type
    List<GDPRRequest> findByRequestType(String requestType);

    // Find by user and status
    List<GDPRRequest> findByUserAndStatus(User user, String status);

    // Count requests by status
    long countByStatus(String status);

    // Count requests by company
    long countByCompany(Company company);

    // Find requests between dates
    List<GDPRRequest> findByRequestDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Custom query: Find recent requests (last 30 days)
    @Query("SELECT r FROM GDPRRequest r WHERE r.requestDate >= :thirtyDaysAgo ORDER BY r.requestDate DESC")
    List<GDPRRequest> findRecentRequests(@Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo);
}