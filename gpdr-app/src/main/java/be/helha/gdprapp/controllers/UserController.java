package be.helha.gdprapp.controllers;

import be.helha.gdprapp.models.User;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // Get all users (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Get user by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get user by email
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == #email")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userService.getUserByEmail(email);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create new user (Admin only) - Utilise Map pour gérer id_role
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userDetails) {
        try {
            // Vérifier que l'email n'existe pas déjà
            if (userDetails.containsKey("email") && userDetails.get("email") != null) {
                String email = (String) userDetails.get("email");
                if (userService.existsByEmail(email)) {
                    return ResponseEntity.badRequest()
                            .body("Error: Email is already in use!");
                }
            }

            User savedUser = userService.createUser(userDetails);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error creating user: " + e.getMessage());
        }
    }

    // Update user - accepte un Map pour gérer id_role
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> userDetails) {
        try {
            Optional<User> existingUser = userService.getUserById(id);
            if (existingUser.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Check if email is being changed and if it already exists
            if (userDetails.containsKey("email") && userDetails.get("email") != null) {
                String newEmail = (String) userDetails.get("email");
                if (!existingUser.get().getEmail().equals(newEmail)
                        && userService.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest()
                            .body("Error: Email is already in use!");
                }
            }

            User updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error updating user: " + e.getMessage());
        }
    }

    // Deactivate user (soft delete)
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Integer id) {
        try {
            User deactivatedUser = userService.deactivateUser(id);
            return ResponseEntity.ok(deactivatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error deactivating user: " + e.getMessage());
        }
    }

    // Activate user
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Integer id) {
        try {
            User activatedUser = userService.activateUser(id);
            return ResponseEntity.ok(activatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error activating user: " + e.getMessage());
        }
    }

    // Delete user permanently (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error deleting user: " + e.getMessage());
        }
    }

    // Get users by role
    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable Integer roleId) {
        List<User> users = userService.getUsersByRole(roleId);
        return ResponseEntity.ok(users);
    }

    // Get active users only
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getActiveUsers() {
        List<User> activeUsers = userService.getActiveUsers();
        return ResponseEntity.ok(activeUsers);
    }

    // Change user password
    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    public ResponseEntity<?> changePassword(@PathVariable Integer id,
                                            @RequestBody PasswordChangeRequest request) {
        try {
            userService.changePassword(id, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok().body("Password changed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error changing password: " + e.getMessage());
        }
    }

    // Inner class for password change request
    public static class PasswordChangeRequest {
        private String oldPassword;
        private String newPassword;

        // Getters and setters
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}