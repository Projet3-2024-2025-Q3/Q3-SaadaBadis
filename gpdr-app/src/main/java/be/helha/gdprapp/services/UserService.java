package be.helha.gdprapp.services;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Check if email exists
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Create new user avec Map pour gérer id_role
    public User createUser(Map<String, Object> userDetails) {
        User user = new User();

        // Set basic fields
        if (userDetails.containsKey("firstname")) {
            user.setFirstname((String) userDetails.get("firstname"));
        }
        if (userDetails.containsKey("lastname")) {
            user.setLastname((String) userDetails.get("lastname"));
        }
        if (userDetails.containsKey("email")) {
            user.setEmail((String) userDetails.get("email"));
        }

        // Handle password
        if (userDetails.containsKey("password") && userDetails.get("password") != null) {
            String password = (String) userDetails.get("password");
            user.setPassword(passwordEncoder.encode(password));
        } else {
            throw new RuntimeException("Password is required for user creation");
        }

        // Handle role via id_role
        if (userDetails.containsKey("id_role")) {
            Object roleIdObj = userDetails.get("id_role");
            Integer roleId;

            if (roleIdObj instanceof Integer) {
                roleId = (Integer) roleIdObj;
            } else if (roleIdObj instanceof String) {
                roleId = Integer.parseInt((String) roleIdObj);
            } else {
                roleId = null;
            }

            if (roleId != null) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
                user.setRole(role);
            }
        } else {
            // Set default role if not provided
            Role defaultRole = roleRepository.findByRole("CLIENT")
                    .orElseThrow(() -> new RuntimeException("Default role 'CLIENT' not found"));
            user.setRole(defaultRole);
        }

        // Set default active status
        if (userDetails.containsKey("active")) {
            user.setActive((Boolean) userDetails.get("active"));
        } else {
            user.setActive(true);
        }

        return userRepository.save(user);
    }

    // Create new user (méthode originale conservée pour compatibilité)
    public User createUser(User user) {
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Set default role if not provided
        if (user.getRole() == null) {
            Role defaultRole = roleRepository.findByRole("CLIENT")
                    .orElseThrow(() -> new RuntimeException("Default role 'CLIENT' not found"));
            user.setRole(defaultRole);
        }

        // Set default active status
        if (user.getActive() == null) {
            user.setActive(true);
        }

        return userRepository.save(user);
    }

    // Update user avec Map pour gérer id_role
    public User updateUser(Integer id, Map<String, Object> userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update fields
        if (userDetails.containsKey("firstname")) {
            user.setFirstname((String) userDetails.get("firstname"));
        }
        if (userDetails.containsKey("lastname")) {
            user.setLastname((String) userDetails.get("lastname"));
        }
        if (userDetails.containsKey("email")) {
            user.setEmail((String) userDetails.get("email"));
        }

        // Gérer id_role spécifiquement
        if (userDetails.containsKey("id_role")) {
            Object roleIdObj = userDetails.get("id_role");
            Integer roleId;

            if (roleIdObj instanceof Integer) {
                roleId = (Integer) roleIdObj;
            } else if (roleIdObj instanceof String) {
                roleId = Integer.parseInt((String) roleIdObj);
            } else {
                roleId = null;
            }

            if (roleId != null) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
                user.setRole(role);
            }
        }

        if (userDetails.containsKey("active")) {
            user.setActive((Boolean) userDetails.get("active"));
        }

        // Only update password if provided and encode it
        if (userDetails.containsKey("password") && userDetails.get("password") != null) {
            String password = (String) userDetails.get("password");
            if (!password.isEmpty()) {
                user.setPassword(passwordEncoder.encode(password));
            }
        }

        return userRepository.save(user);
    }

    // Deactivate user (soft delete)
    public User deactivateUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setActive(false);
        return userRepository.save(user);
    }

    // Activate user
    public User activateUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setActive(true);
        return userRepository.save(user);
    }

    // Delete user permanently
    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    // Get users by role
    public List<User> getUsersByRole(Integer roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
        return userRepository.findByRole(role);
    }

    // Get users by role name
    public List<User> getUsersByRoleName(String roleName) {
        return userRepository.findByRoleRole(roleName);
    }

    // Get active users only
    public List<User> getActiveUsers() {
        return userRepository.findByActiveTrue();
    }

    // Change password
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        // Update with new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Check if current authenticated user is the same as the user ID
    public boolean isCurrentUser(Integer userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String currentUserEmail = authentication.getName();
        Optional<User> user = userRepository.findById(userId);

        return user.isPresent() && user.get().getEmail().equals(currentUserEmail);
    }

    // Get current authenticated user
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }

        String currentUserEmail = authentication.getName();
        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    // Check if user has specific role
    public boolean hasRole(Integer userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return user.getRole().getRole().equals(roleName);
    }

    // Count users by role
    public long countUsersByRole(String roleName) {
        return userRepository.findByRoleRole(roleName).size();
    }

    // Search users by name
    public List<User> searchUsersByName(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllUsers();
        }

        // Pour l'instant, retournons tous les utilisateurs
        // Vous pouvez implémenter la recherche dans le repository
        return getAllUsers();
    }

    // Validate user credentials (for authentication)
    public boolean validateCredentials(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getActive()) {
            return passwordEncoder.matches(password, user.get().getPassword());
        }
        return false;
    }
}