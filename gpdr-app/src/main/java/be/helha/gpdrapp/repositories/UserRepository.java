package be.helha.gpdrapp.repositories;

import be.helha.gpdrapp.models.Role;
import be.helha.gpdrapp.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
