package be.helha.gdprapp.repositories;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // For authentication
    Optional<User> findByEmail(String email);

    // Check if email already exists
    boolean existsByEmail(String email);

    // Find users by role
    List<User> findByRole(Role role);

    // Find active users
    List<User> findByActiveTrue();

    // Find users by role name (alternative method)
    List<User> findByRoleRole(String roleName);
    // Ajoutez ces méthodes à votre UserRepository existant :

    // Find users by company
    List<User> findByCompany(Company company);

    // Find users by company ID
    List<User> findByCompanyIdCompany(Integer companyId);

    // Find users by company ID and role
    List<User> findByCompanyIdCompanyAndRoleRole(Integer companyId, String roleName);

    // Find managers (GERANT) of a specific company
    @Query("SELECT u FROM User u WHERE u.company.idCompany = :companyId AND u.role.role = 'GERANT'")
    List<User> findManagersByCompanyId(@Param("companyId") Integer companyId);

    // Find users without company (useful for assignment)
    List<User> findByCompanyIsNull();

    // Find GERANT users without company
    List<User> findByCompanyIsNullAndRoleRole(String roleName);

    // Custom query for UserDetailsService - assuming email is used as username
    @Query("SELECT u FROM User u WHERE u.email = :username")
    Optional<User> findByUsername(@Param("username") String username);
}