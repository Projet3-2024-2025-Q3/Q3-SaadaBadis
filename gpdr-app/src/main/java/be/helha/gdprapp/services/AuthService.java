package be.helha.gdprapp.services;

import be.helha.gdprapp.controllers.AuthController.RegisterRequest;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Register new user
    public User registerUser(RegisterRequest registerRequest) {
        // Validate registration data
        validateRegistrationData(registerRequest);

        // Check if email already exists
        if (existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use: " + registerRequest.getEmail());
        }

        // Get role (default to USER if not specified)
        Role role;
        if (registerRequest.getRoleId() != null) {
            role = roleRepository.findById(registerRequest.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + registerRequest.getRoleId()));
        } else {
            role = roleRepository.findByRole("USER")
                    .orElseThrow(() -> new RuntimeException("Default role 'USER' not found"));
        }

        // Create new user
        User user = new User();
        user.setFirstname(registerRequest.getFirstname().trim());
        user.setLastname(registerRequest.getLastname().trim());
        user.setEmail(registerRequest.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);
        user.setActive(true);

        return userRepository.save(user);
    }

    // Get user by email
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    // Check if email exists
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Change password
    public void changePassword(String userEmail, String oldPassword, String newPassword) {
        User user = getUserByEmail(userEmail);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password
        validatePassword(newPassword);

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Request password reset (basic implementation)
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (!user.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        // In a real implementation, you would:
        // 1. Generate a reset token
        // 2. Store it in database with expiration
        // 3. Send email with reset link
        // For now, we'll just log it
        System.out.println("Password reset requested for user: " + email);
        // TODO: Implement actual password reset functionality
    }

    // Reset password with token (basic implementation)
    public void resetPassword(String email, String resetToken, String newPassword) {
        User user = getUserByEmail(email);

        // In a real implementation, you would:
        // 1. Validate the reset token
        // 2. Check if token is not expired
        // 3. Update password if valid
        // For now, we'll just validate the new password and update it
        validatePassword(newPassword);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Activate user account
    public void activateUser(String email) {
        User user = getUserByEmail(email);
        user.setActive(true);
        userRepository.save(user);
    }

    // Deactivate user account
    public void deactivateUser(String email) {
        User user = getUserByEmail(email);
        user.setActive(false);
        userRepository.save(user);
    }

    // Update user profile
    public User updateUserProfile(String email, UpdateProfileRequest updateRequest) {
        User user = getUserByEmail(email);

        // Update fields if provided
        if (updateRequest.getFirstname() != null && !updateRequest.getFirstname().trim().isEmpty()) {
            user.setFirstname(updateRequest.getFirstname().trim());
        }

        if (updateRequest.getLastname() != null && !updateRequest.getLastname().trim().isEmpty()) {
            user.setLastname(updateRequest.getLastname().trim());
        }

        // Email update requires additional validation
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) {
            String newEmail = updateRequest.getEmail().trim().toLowerCase();
            if (!user.getEmail().equals(newEmail)) {
                if (existsByEmail(newEmail)) {
                    throw new RuntimeException("Email is already in use: " + newEmail);
                }
                validateEmail(newEmail);
                user.setEmail(newEmail);
            }
        }

        return userRepository.save(user);
    }

    // Validate user credentials for login
    public boolean validateCredentials(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return user.getActive() && passwordEncoder.matches(password, user.getPassword());
        }
        return false;
    }

    // Check if user has specific role
    public boolean hasRole(String email, String roleName) {
        User user = getUserByEmail(email);
        return user.getRole().getRole().equals(roleName);
    }

    // Get user role
    public String getUserRole(String email) {
        User user = getUserByEmail(email);
        return user.getRole().getRole();
    }

    // Check if user is admin
    public boolean isAdmin(String email) {
        return hasRole(email, "ADMIN");
    }

    // Check if user account is active
    public boolean isAccountActive(String email) {
        User user = getUserByEmail(email);
        return user.getActive();
    }

    // Get user statistics
    public UserAuthStatistics getUserAuthStatistics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findByActiveTrue().size();
        long inactiveUsers = totalUsers - activeUsers;
        long adminUsers = userRepository.findByRoleRole("ADMIN").size();
        long regularUsers = userRepository.findByRoleRole("USER").size();

        UserAuthStatistics stats = new UserAuthStatistics();
        stats.setTotalUsers(totalUsers);
        stats.setActiveUsers(activeUsers);
        stats.setInactiveUsers(inactiveUsers);
        stats.setAdminUsers(adminUsers);
        stats.setRegularUsers(regularUsers);

        // Calculate percentages
        if (totalUsers > 0) {
            stats.setActiveUserPercentage((double) activeUsers / totalUsers * 100);
            stats.setAdminUserPercentage((double) adminUsers / totalUsers * 100);
        }

        return stats;
    }

    // Validate registration data
    private void validateRegistrationData(RegisterRequest registerRequest) {
        if (registerRequest == null) {
            throw new RuntimeException("Registration data cannot be null");
        }

        // Validate firstname
        if (registerRequest.getFirstname() == null || registerRequest.getFirstname().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (registerRequest.getFirstname().length() > 50) {
            throw new RuntimeException("First name cannot exceed 50 characters");
        }

        // Validate lastname
        if (registerRequest.getLastname() == null || registerRequest.getLastname().trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
        }
        if (registerRequest.getLastname().length() > 50) {
            throw new RuntimeException("Last name cannot exceed 50 characters");
        }

        // Validate email
        validateEmail(registerRequest.getEmail());

        // Validate password
        validatePassword(registerRequest.getPassword());
    }

    // Validate email format and constraints
    private void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        email = email.trim();

        if (email.length() > 50) {
            throw new RuntimeException("Email cannot exceed 50 characters");
        }

        // Basic email validation regex
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!email.matches(emailRegex)) {
            throw new RuntimeException("Invalid email format");
        }
    }

    // Validate password strength
    private void validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }

        if (password.length() > 128) {
            throw new RuntimeException("Password cannot exceed 128 characters");
        }

        // Additional password strength checks
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        boolean hasDigit = password.matches(".*[0-9].*");

        if (!hasLetter || !hasDigit) {
            throw new RuntimeException("Password must contain at least one letter and one number");
        }
    }

    // Inner classes for DTOs
    public static class UpdateProfileRequest {
        private String firstname;
        private String lastname;
        private String email;

        // Getters and setters
        public String getFirstname() { return firstname; }
        public void setFirstname(String firstname) { this.firstname = firstname; }

        public String getLastname() { return lastname; }
        public void setLastname(String lastname) { this.lastname = lastname; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class UserAuthStatistics {
        private long totalUsers;
        private long activeUsers;
        private long inactiveUsers;
        private long adminUsers;
        private long regularUsers;
        private double activeUserPercentage;
        private double adminUserPercentage;

        // Getters and setters
        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

        public long getActiveUsers() { return activeUsers; }
        public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

        public long getInactiveUsers() { return inactiveUsers; }
        public void setInactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; }

        public long getAdminUsers() { return adminUsers; }
        public void setAdminUsers(long adminUsers) { this.adminUsers = adminUsers; }

        public long getRegularUsers() { return regularUsers; }
        public void setRegularUsers(long regularUsers) { this.regularUsers = regularUsers; }

        public double getActiveUserPercentage() { return activeUserPercentage; }
        public void setActiveUserPercentage(double activeUserPercentage) { this.activeUserPercentage = activeUserPercentage; }

        public double getAdminUserPercentage() { return adminUserPercentage; }
        public void setAdminUserPercentage(double adminUserPercentage) { this.adminUserPercentage = adminUserPercentage; }
    }
}