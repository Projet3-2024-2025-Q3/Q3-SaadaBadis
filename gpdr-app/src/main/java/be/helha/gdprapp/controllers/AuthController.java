package be.helha.gdprapp.controllers;

import be.helha.gdprapp.models.User;
import be.helha.gdprapp.services.AuthService;
import be.helha.gdprapp.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JWTUtils jwtUtils;

    // Register new user
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        System.out.println("=== REGISTER REQUEST RECEIVED ===");
        System.out.println("Request: " + registerRequest);

        try {
            // Check if email already exists
            if (authService.existsByEmail(registerRequest.getEmail())) {
                System.out.println("Email already exists: " + registerRequest.getEmail());
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            // Create new user
            System.out.println("Creating new user...");
            User user = authService.registerUser(registerRequest);
            System.out.println("User created successfully: " + user.getEmail());

            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (Exception e) {
            System.out.println("Error during registration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    // Login user
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword())
            );

            // Get user information from our service
            User user = authService.getUserByEmail(loginRequest.getEmail());

            // Generate JWT token using our User entity
            String jwt = jwtUtils.generateToken(user);

            return ResponseEntity.ok(new JwtResponse(jwt,
                    user.getIdUser(),
                    user.getEmail(),
                    user.getFirstname(),
                    user.getLastname(),
                    user.getRole().getRole()));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid email or password!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    // Refresh JWT token
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        try {
            String oldToken = request.getToken();

            // Validate old token
            if (jwtUtils.validateToken(oldToken)) {
                String email = jwtUtils.extractUsername(oldToken);
                User user = authService.getUserByEmail(email);

                // Generate new token
                String newToken = jwtUtils.generateToken(user);

                return ResponseEntity.ok(new TokenRefreshResponse(newToken));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Invalid refresh token!"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error refreshing token: " + e.getMessage()));
        }
    }

    // Logout user (optional - mainly for frontend to clear token)
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        return ResponseEntity.ok(new MessageResponse("User logged out successfully!"));
    }

    // Validate token
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody TokenValidationRequest request) {
        try {
            boolean isValid = jwtUtils.validateToken(request.getToken());
            if (isValid) {
                String email = jwtUtils.extractUsername(request.getToken());
                User user = authService.getUserByEmail(email);
                return ResponseEntity.ok(new UserInfoResponse(
                        user.getIdUser(),
                        user.getEmail(),
                        user.getFirstname(),
                        user.getLastname(),
                        user.getRole().getRole(),
                        user.getActive()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Invalid token!"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Token validation failed: " + e.getMessage()));
        }
    }

    // Change password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            authService.changePassword(userEmail, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error changing password: " + e.getMessage()));
        }
    }

    // Request password reset (basic implementation)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("Password reset instructions sent to your email!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    // Inner classes for request/response DTOs
    public static class LoginRequest {
        private String email;
        private String password;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String firstname;
        private String lastname;
        private String email;
        private String password;
        private Integer roleId;

        // Getters and setters
        public String getFirstname() { return firstname; }
        public void setFirstname(String firstname) { this.firstname = firstname; }
        public String getLastname() { return lastname; }
        public void setLastname(String lastname) { this.lastname = lastname; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public Integer getRoleId() { return roleId; }
        public void setRoleId(Integer roleId) { this.roleId = roleId; }

        @Override
        public String toString() {
            return "RegisterRequest{" +
                    "firstname='" + firstname + '\'' +
                    ", lastname='" + lastname + '\'' +
                    ", email='" + email + '\'' +
                    ", password='[HIDDEN]'" +
                    ", roleId=" + roleId +
                    '}';
        }
    }

    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;

        // Getters and setters
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class TokenRefreshRequest {
        private String token;

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class TokenValidationRequest {
        private String token;

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class ForgotPasswordRequest {
        private String email;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private Integer id;
        private String email;
        private String firstname;
        private String lastname;
        private String role;

        public JwtResponse(String accessToken, Integer id, String email, String firstname, String lastname, String role) {
            this.token = accessToken;
            this.id = id;
            this.email = email;
            this.firstname = firstname;
            this.lastname = lastname;
            this.role = role;
        }

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstname() { return firstname; }
        public void setFirstname(String firstname) { this.firstname = firstname; }
        public String getLastname() { return lastname; }
        public void setLastname(String lastname) { this.lastname = lastname; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class TokenRefreshResponse {
        private String token;
        private String type = "Bearer";

        public TokenRefreshResponse(String token) {
            this.token = token;
        }

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class UserInfoResponse {
        private Integer id;
        private String email;
        private String firstname;
        private String lastname;
        private String role;
        private Boolean active;

        public UserInfoResponse(Integer id, String email, String firstname, String lastname, String role, Boolean active) {
            this.id = id;
            this.email = email;
            this.firstname = firstname;
            this.lastname = lastname;
            this.role = role;
            this.active = active;
        }

        // Getters and setters
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstname() { return firstname; }
        public void setFirstname(String firstname) { this.firstname = firstname; }
        public String getLastname() { return lastname; }
        public void setLastname(String lastname) { this.lastname = lastname; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
    }
}