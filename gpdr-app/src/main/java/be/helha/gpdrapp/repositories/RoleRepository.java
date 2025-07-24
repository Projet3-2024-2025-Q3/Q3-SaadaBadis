package be.helha.gpdrapp.repositories;

import be.helha.gpdrapp.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    // Find role by name
    Optional<Role> findByRole(String role);

    // Check if role exists
    boolean existsByRole(String role);
}