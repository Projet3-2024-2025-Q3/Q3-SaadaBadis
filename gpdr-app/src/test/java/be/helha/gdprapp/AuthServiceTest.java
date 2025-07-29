package be.helha.gdprapp;

import be.helha.gdprapp.controllers.AuthController.RegisterRequest;
import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.services.AuthService;
import be.helha.gdprapp.services.EmailService;
import be.helha.gdprapp.services.PasswordGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordGeneratorService passwordGeneratorService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role testRole;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        testRole = new Role();
        testRole.setIdRole(1);
        testRole.setRole("CLIENT");

        testUser = new User();
        testUser.setIdUser(1);
        testUser.setFirstname("John");
        testUser.setLastname("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setActive(true);
        testUser.setRole(testRole);

        registerRequest = new RegisterRequest();
        registerRequest.setFirstname("John");
        registerRequest.setLastname("Doe");
        registerRequest.setEmail("john.doe@example.com");
        registerRequest.setPassword("password123");
    }

    @Test
    void registerUser_WithValidData_ShouldCreateUser() {
        // Given
        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.of(testRole));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = authService.registerUser(registerRequest);

        // Then
        assertNotNull(result);
        assertEquals("john.doe@example.com", result.getEmail());
        verify(userRepository).existsByEmail("john.doe@example.com");
        verify(roleRepository).findByRole("CLIENT");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_WithExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(registerRequest);
        });

        assertEquals("Email is already in use: john.doe@example.com", exception.getMessage());
        verify(userRepository).existsByEmail("john.doe@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_WithNonExistentRole_ShouldThrowException() {
        // Given
        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(registerRequest);
        });

        assertEquals("Default role 'CLIENT' not found", exception.getMessage());
        verify(roleRepository).findByRole("CLIENT");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_WithInvalidData_ShouldThrowException() {
        // Given
        registerRequest.setFirstname(null); // Invalid data

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(registerRequest);
        });

        assertEquals("First name is required", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserByEmail_WhenUserExists_ShouldReturnUser() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        User result = authService.getUserByEmail("john.doe@example.com");

        // Then
        assertNotNull(result);
        assertEquals("john.doe@example.com", result.getEmail());
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void getUserByEmail_WhenUserNotExists_ShouldThrowException() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.getUserByEmail("nonexistent@example.com");
        });

        assertEquals("User not found with email: nonexistent@example.com", exception.getMessage());
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void existsByEmail_WhenUserExists_ShouldReturnTrue() {
        // Given
        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // When
        boolean result = authService.existsByEmail("john.doe@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).existsByEmail("john.doe@example.com");
    }

    @Test
    void changePassword_WithValidCredentials_ShouldUpdatePassword() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword123", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        authService.changePassword("john.doe@example.com", "oldPassword123", "newPassword123");

        // Then
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("oldPassword123", "encodedPassword");
        verify(passwordEncoder).encode("newPassword123");
        verify(userRepository).save(testUser);
    }

    @Test
    void changePassword_WithIncorrectOldPassword_ShouldThrowException() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongOldPassword", "encodedPassword")).thenReturn(false);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.changePassword("john.doe@example.com", "wrongOldPassword", "newPassword123");
        });

        assertEquals("Current password is incorrect", exception.getMessage());
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("wrongOldPassword", "encodedPassword");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void requestPasswordReset_WithValidEmail_ShouldGenerateNewPassword() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordGeneratorService.generateRandomPassword(12)).thenReturn("NewPass123!");
        when(passwordEncoder.encode("NewPass123!")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        authService.requestPasswordReset("john.doe@example.com");

        // Then
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordGeneratorService).generateRandomPassword(12);
        verify(passwordEncoder).encode("NewPass123!");
        verify(userRepository).save(testUser);
    }

    @Test
    void requestPasswordReset_WithInactiveUser_ShouldThrowException() {
        // Given
        testUser.setActive(false);
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.requestPasswordReset("john.doe@example.com");
        });

        assertEquals("Account is deactivated. Please contact support.", exception.getMessage());
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordGeneratorService, never()).generateRandomPassword(anyInt());
    }

    @Test
    void requestPasswordReset_WithNonExistentEmail_ShouldThrowException() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.requestPasswordReset("nonexistent@example.com");
        });

        assertEquals("User not found with email: nonexistent@example.com", exception.getMessage());
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordGeneratorService, never()).generateRandomPassword(anyInt());
    }

    @Test
    void validateCredentials_WithValidCredentials_ShouldReturnTrue() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // When
        boolean result = authService.validateCredentials("john.doe@example.com", "password123");

        // Then
        assertTrue(result);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("password123", "encodedPassword");
    }

    @Test
    void validateCredentials_WithInvalidCredentials_ShouldReturnFalse() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword123", "encodedPassword")).thenReturn(false);

        // When
        boolean result = authService.validateCredentials("john.doe@example.com", "wrongPassword123");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("wrongPassword123", "encodedPassword");
    }

    @Test
    void hasRole_WithCorrectRole_ShouldReturnTrue() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        boolean result = authService.hasRole("john.doe@example.com", "CLIENT");

        // Then
        assertTrue(result);
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void hasRole_WithIncorrectRole_ShouldReturnFalse() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        boolean result = authService.hasRole("john.doe@example.com", "ADMIN");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void isAccountActive_WithActiveUser_ShouldReturnTrue() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        boolean result = authService.isAccountActive("john.doe@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void isAccountActive_WithInactiveUser_ShouldReturnFalse() {
        // Given
        testUser.setActive(false);
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        boolean result = authService.isAccountActive("john.doe@example.com");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("john.doe@example.com");
    }
}