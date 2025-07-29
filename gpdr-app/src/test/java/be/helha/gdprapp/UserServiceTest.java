package be.helha.gdprapp;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Role testRole;

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
    }

    @Test
    void getAllUsers_ShouldReturnListOfUsers() {
        // Given
        List<User> expectedUsers = Arrays.asList(testUser);
        when(userRepository.findAll()).thenReturn(expectedUsers);

        // When
        List<User> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testUser.getEmail(), result.get(0).getEmail());
        verify(userRepository).findAll();
    }

    @Test
    void getUserById_WhenUserExists_ShouldReturnUser() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.getUserById(1);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testUser.getEmail(), result.get().getEmail());
        verify(userRepository).findById(1);
    }

    @Test
    void getUserById_WhenUserNotExists_ShouldReturnEmpty() {
        // Given
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        // When
        Optional<User> result = userService.getUserById(999);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(999);
    }

    @Test
    void getUserByEmail_WhenUserExists_ShouldReturnUser() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.getUserByEmail("john.doe@example.com");

        // Then
        assertTrue(result.isPresent());
        assertEquals(testUser.getEmail(), result.get().getEmail());
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void existsByEmail_WhenUserExists_ShouldReturnTrue() {
        // Given
        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // When
        boolean result = userService.existsByEmail("john.doe@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).existsByEmail("john.doe@example.com");
    }

    @Test
    void existsByEmail_WhenUserNotExists_ShouldReturnFalse() {
        // Given
        when(userRepository.existsByEmail("nonexistent@example.com")).thenReturn(false);

        // When
        boolean result = userService.existsByEmail("nonexistent@example.com");

        // Then
        assertFalse(result);
        verify(userRepository).existsByEmail("nonexistent@example.com");
    }

    @Test
    void createUser_WithValidData_ShouldCreateUser() {
        // Given
        User newUser = new User();
        newUser.setFirstname("Jane");
        newUser.setLastname("Smith");
        newUser.setEmail("jane.smith@example.com");
        newUser.setPassword("plainPassword");

        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.of(testRole));
        when(passwordEncoder.encode("plainPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(newUser);

        // When
        User result = userService.createUser(newUser);

        // Then
        assertNotNull(result);
        verify(passwordEncoder).encode("plainPassword");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_WhenDefaultRoleNotFound_ShouldThrowException() {
        // Given
        User newUser = new User();
        newUser.setFirstname("Jane");
        newUser.setLastname("Smith");
        newUser.setEmail("jane.smith@example.com");
        newUser.setPassword("plainPassword");

        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.createUser(newUser);
        });

        assertEquals("Default role 'CLIENT' not found", exception.getMessage());
        verify(roleRepository).findByRole("CLIENT");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUser_WithValidData_ShouldUpdateUser() {
        // Given
        User updatedDetails = new User();
        updatedDetails.setFirstname("UpdatedJohn");
        updatedDetails.setLastname("UpdatedDoe");
        updatedDetails.setEmail("updated.john@example.com");

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.updateUser(1, updatedDetails);

        // Then
        assertNotNull(result);
        verify(userRepository).findById(1);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_WhenUserNotFound_ShouldThrowException() {
        // Given
        User updatedDetails = new User();
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.updateUser(999, updatedDetails);
        });

        assertEquals("User not found with id: 999", exception.getMessage());
        verify(userRepository).findById(999);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deactivateUser_WhenUserExists_ShouldDeactivateUser() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.deactivateUser(1);

        // Then
        assertNotNull(result);
        assertFalse(result.getActive());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
    }

    @Test
    void activateUser_WhenUserExists_ShouldActivateUser() {
        // Given
        testUser.setActive(false); // Initially deactivated
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.activateUser(1);

        // Then
        assertNotNull(result);
        assertTrue(result.getActive());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
    }

    @Test
    void deleteUser_WhenUserExists_ShouldDeleteUser() {
        // Given
        when(userRepository.existsById(1)).thenReturn(true);

        // When
        userService.deleteUser(1);

        // Then
        verify(userRepository).existsById(1);
        verify(userRepository).deleteById(1);
    }

    @Test
    void deleteUser_WhenUserNotExists_ShouldThrowException() {
        // Given
        when(userRepository.existsById(999)).thenReturn(false);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.deleteUser(999);
        });

        assertEquals("User not found with id: 999", exception.getMessage());
        verify(userRepository).existsById(999);
        verify(userRepository, never()).deleteById(anyInt());
    }

    @Test
    void getActiveUsers_ShouldReturnActiveUsers() {
        // Given
        List<User> activeUsers = Arrays.asList(testUser);
        when(userRepository.findByActiveTrue()).thenReturn(activeUsers);

        // When
        List<User> result = userService.getActiveUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.get(0).getActive());
        verify(userRepository).findByActiveTrue();
    }

    @Test
    void validateCredentials_WithValidCredentials_ShouldReturnTrue() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("plainPassword", "encodedPassword")).thenReturn(true);

        // When
        boolean result = userService.validateCredentials("john.doe@example.com", "plainPassword");

        // Then
        assertTrue(result);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("plainPassword", "encodedPassword");
    }

    @Test
    void validateCredentials_WithInvalidCredentials_ShouldReturnFalse() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        // When
        boolean result = userService.validateCredentials("john.doe@example.com", "wrongPassword");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder).matches("wrongPassword", "encodedPassword");
    }

    @Test
    void validateCredentials_WithInactiveUser_ShouldReturnFalse() {
        // Given
        testUser.setActive(false);
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.validateCredentials("john.doe@example.com", "plainPassword");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void validateCredentials_WithNonExistentUser_ShouldReturnFalse() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        boolean result = userService.validateCredentials("nonexistent@example.com", "plainPassword");

        // Then
        assertFalse(result);
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}