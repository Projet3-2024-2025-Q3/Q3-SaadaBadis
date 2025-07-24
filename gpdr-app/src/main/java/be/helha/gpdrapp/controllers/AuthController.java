package be.helha.gpdrapp.controllers;

import be.helha.gpdrapp.models.JWT;
import be.helha.gpdrapp.models.User;
import be.helha.gpdrapp.services.UserService;
import be.helha.gpdrapp.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JWTUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String accessToken = jwtUtils.generateJwtToken(user);
            String refreshToken = jwtUtils.generateJwtToken(user);

            return ResponseEntity.ok(new JWT(accessToken, refreshToken));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
        try {
            String firstname = registerRequest.get("firstname");
            String lastname = registerRequest.get("lastname");
            String email = registerRequest.get("email");
            String password = registerRequest.get("password");
            String role = registerRequest.getOrDefault("role", "CLIENT");

            User newUser = userService.createUser(firstname, lastname, email, password, role);

            return ResponseEntity.ok(Map.of(
                    "message", "User registered successfully",
                    "userId", newUser.getIdUser(),
                    "email", newUser.getEmail()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(Map.of(
                    "id", user.getIdUser(),
                    "firstname", user.getFirstname(),
                    "lastname", user.getLastname(),
                    "email", user.getEmail(),
                    "role", user.getRole().getRole()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
String password = loginRequest.get("password");

// Authenticate user
Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(email, password)
);

// Get user details
User user = userService.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

// Generate JWT tokens
String accessToken = jwtUtil.generateJwtToken(user);
String refreshToken = jwtUtil.generateJwtToken(user); // For now, same as access token

            return ResponseEntity.ok(new JWT(accessToken, refreshToken));

        } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid credentials"));
        }
        }

/**
 * Register endpoint - Create new user
 */
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody Map<String, String> registerRequest) {
    try {
        String firstname = registerRequest.get("firstname");
        String lastname = registerRequest.get("lastname");
        String email = registerRequest.get("email");
        String password = registerRequest.get("password");
        String role = registerRequest.getOrDefault("role", "CLIENT"); // Default role

        // Create user
        User newUser = userService.createUser(firstname, lastname, email, password, role);

        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "userId", newUser.getIdUser(),
                "email", newUser.getEmail()
        ));

    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}

/**
 * Get current user info
 */
@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(Authentication authentication) {
    try {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getIdUser(),
                "firstname", user.getFirstname(),
                "lastname", user.getLastname(),
                "email", user.getEmail(),
                "role", user.getRole().getRole()
        ));

    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}
}