package be.helha.gdprapp.services;

import be.helha.gdprapp.models.User;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Find user by email for authentication
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Create a new user with encrypted password
     */
    public User createUser(String firstname, String lastname, String email, String rawPassword, String roleName) {
        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists: " + email);
        }

        // Find role
        Role role = roleRepository.findByRole(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        // Create user with encrypted password
        User user = new User();
        user.setFirstname(firstname);
        user.setLastname(lastname);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(true);

        return userRepository.save(user);
    }

    /**
     * Get all active users
     */
    public List<User> findAllActiveUsers() {
        return userRepository.findByActiveTrue();
    }

    /**
     * Find users by role
     */
    public List<User> findUsersByRole(String roleName) {
        Role role = roleRepository.findByRole(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        return userRepository.findByRole(role);
    }

    /**
     * Deactivate user (soft delete)
     */
    public void deactivateUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Update user information
     */
    public User updateUser(Integer userId, String firstname, String lastname) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setFirstname(firstname);
        user.setLastname(lastname);

        return userRepository.save(user);
    }
}