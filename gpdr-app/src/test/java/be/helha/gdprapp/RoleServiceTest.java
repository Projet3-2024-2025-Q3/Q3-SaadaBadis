package be.helha.gdprapp;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.models.User;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import be.helha.gdprapp.services.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoleService roleService;

    private Role testRole;
    private User testUser;

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
        testUser.setRole(testRole);
    }

    @Test
    void getAllRoles_ShouldReturnListOfRoles() {
        // Given
        List<Role> expectedRoles = Arrays.asList(testRole);
        when(roleRepository.findAll()).thenReturn(expectedRoles);

        // When
        List<Role> result = roleService.getAllRoles();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CLIENT", result.get(0).getRole());
        verify(roleRepository).findAll();
    }

    @Test
    void getRoleById_WhenRoleExists_ShouldReturnRole() {
        // Given
        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));

        // When
        Optional<Role> result = roleService.getRoleById(1);

        // Then
        assertTrue(result.isPresent());
        assertEquals("CLIENT", result.get().getRole());
        verify(roleRepository).findById(1);
    }

    @Test
    void getRoleById_WhenRoleNotExists_ShouldReturnEmpty() {
        // Given
        when(roleRepository.findById(999)).thenReturn(Optional.empty());

        // When
        Optional<Role> result = roleService.getRoleById(999);

        // Then
        assertFalse(result.isPresent());
        verify(roleRepository).findById(999);
    }

    @Test
    void getRoleByName_WhenRoleExists_ShouldReturnRole() {
        // Given
        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.of(testRole));

        // When
        Optional<Role> result = roleService.getRoleByName("CLIENT");

        // Then
        assertTrue(result.isPresent());
        assertEquals("CLIENT", result.get().getRole());
        verify(roleRepository).findByRole("CLIENT");
    }

    @Test
    void existsByRoleName_WhenRoleExists_ShouldReturnTrue() {
        // Given
        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.of(testRole));

        // When
        boolean result = roleService.existsByRoleName("CLIENT");

        // Then
        assertTrue(result);
        verify(roleRepository).findByRole("CLIENT");
    }

    @Test
    void existsByRoleName_WhenRoleNotExists_ShouldReturnFalse() {
        // Given
        when(roleRepository.findByRole("NONEXISTENT")).thenReturn(Optional.empty());

        // When
        boolean result = roleService.existsByRoleName("NONEXISTENT");

        // Then
        assertFalse(result);
        verify(roleRepository).findByRole("NONEXISTENT");
    }

    @Test
    void createRole_WithValidData_ShouldCreateRole() {
        // Given
        Role newRole = new Role();
        newRole.setRole("MANAGER");

        when(roleRepository.findByRole("MANAGER")).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenReturn(newRole);

        // When
        Role result = roleService.createRole(newRole);

        // Then
        assertNotNull(result);
        verify(roleRepository).findByRole("MANAGER");
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    void createRole_WithExistingName_ShouldThrowException() {
        // Given
        Role newRole = new Role();
        newRole.setRole("CLIENT");

        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.of(testRole));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roleService.createRole(newRole);
        });

        assertEquals("Role with name 'CLIENT' already exists", exception.getMessage());
        verify(roleRepository).findByRole("CLIENT");
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void createRole_WithNullName_ShouldThrowException() {
        // Given
        Role newRole = new Role();
        newRole.setRole(null);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roleService.createRole(newRole);
        });

        assertEquals("Role name cannot be empty", exception.getMessage());
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void createRole_WithEmptyName_ShouldThrowException() {
        // Given
        Role newRole = new Role();
        newRole.setRole("   ");

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roleService.createRole(newRole);
        });

        assertEquals("Role name cannot be empty", exception.getMessage());
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void updateRole_WithValidData_ShouldUpdateRole() {
        // Given
        Role updatedDetails = new Role();
        updatedDetails.setRole("UPDATED_CLIENT");

        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));
        when(roleRepository.findByRole("UPDATED_CLIENT")).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenReturn(testRole);

        // When
        Role result = roleService.updateRole(1, updatedDetails);

        // Then
        assertNotNull(result);
        verify(roleRepository).findById(1);
        verify(roleRepository).findByRole("UPDATED_CLIENT");
        verify(roleRepository).save(testRole);
    }

    @Test
    void updateRole_WhenRoleNotFound_ShouldThrowException() {
        // Given
        Role updatedDetails = new Role();
        updatedDetails.setRole("UPDATED_CLIENT");

        when(roleRepository.findById(999)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roleService.updateRole(999, updatedDetails);
        });

        assertEquals("Role not found with id: 999", exception.getMessage());
        verify(roleRepository).findById(999);
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void deleteRole_WhenRoleExistsAndNoUsers_ShouldDeleteRole() {
        // Given - Utiliser un rôle non-essentiel
        Role customRole = new Role();
        customRole.setIdRole(2);
        customRole.setRole("CUSTOM_ROLE");

        when(roleRepository.findById(2)).thenReturn(Optional.of(customRole));
        when(userRepository.findByRole(customRole)).thenReturn(Collections.emptyList());

        // When
        roleService.deleteRole(2);

        // Then
        verify(roleRepository, times(2)).findById(2); // Une fois dans deleteRole, une fois dans hasAssociatedUsers
        verify(userRepository).findByRole(customRole);
        verify(roleRepository).deleteById(2);
    }

    @Test
    void deleteRole_WhenRoleHasUsers_ShouldThrowException() {
        // Given
        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));
        when(userRepository.findByRole(testRole)).thenReturn(Arrays.asList(testUser));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roleService.deleteRole(1);
        });

        assertEquals("Cannot delete role: It has associated users", exception.getMessage());
        verify(roleRepository, times(2)).findById(1); // Une fois dans deleteRole, une fois dans hasAssociatedUsers
        verify(userRepository).findByRole(testRole);
        verify(roleRepository, never()).deleteById(anyInt());
    }



    @Test
    void hasAssociatedUsers_WhenRoleHasUsers_ShouldReturnTrue() {
        // Given
        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));
        when(userRepository.findByRole(testRole)).thenReturn(Arrays.asList(testUser));

        // When
        boolean result = roleService.hasAssociatedUsers(1);

        // Then
        assertTrue(result);
        verify(roleRepository).findById(1);
        verify(userRepository).findByRole(testRole);
    }

    @Test
    void hasAssociatedUsers_WhenRoleHasNoUsers_ShouldReturnFalse() {
        // Given
        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));
        when(userRepository.findByRole(testRole)).thenReturn(Collections.emptyList());

        // When
        boolean result = roleService.hasAssociatedUsers(1);

        // Then
        assertFalse(result);
        verify(roleRepository).findById(1);
        verify(userRepository).findByRole(testRole);
    }

    @Test
    void getUsersCountByRole_ShouldReturnCorrectCount() {
        // Given
        when(roleRepository.findById(1)).thenReturn(Optional.of(testRole));
        when(userRepository.findByRole(testRole)).thenReturn(Arrays.asList(testUser));

        // When
        long result = roleService.getUsersCountByRole(1);

        // Then
        assertEquals(1, result);
        verify(roleRepository).findById(1);
        verify(userRepository).findByRole(testRole);
    }

    @Test
    void getUsersCountByRoleName_ShouldReturnCorrectCount() {
        // Given
        when(userRepository.findByRoleRole("CLIENT")).thenReturn(Arrays.asList(testUser));

        // When
        long result = roleService.getUsersCountByRoleName("CLIENT");

        // Then
        assertEquals(1, result);
        verify(userRepository).findByRoleRole("CLIENT");
    }

    @Test
    void createDefaultRoles_ShouldCreateAllThreeDefaultRoles() {
        // Given - Aucun rôle par défaut n'existe
        when(roleRepository.findByRole("ADMIN")).thenReturn(Optional.empty());
        when(roleRepository.findByRole("CLIENT")).thenReturn(Optional.empty());
        when(roleRepository.findByRole("GERANT")).thenReturn(Optional.empty());

        // When
        roleService.createDefaultRoles();

        // Then
        verify(roleRepository).findByRole("ADMIN");
        verify(roleRepository).findByRole("CLIENT");
        verify(roleRepository).findByRole("GERANT");
        verify(roleRepository, times(3)).save(any(Role.class)); // Should save all 3 roles
    }

    @Test
    void isValidRoleName_WithValidName_ShouldReturnTrue() {
        // When
        boolean result = roleService.isValidRoleName("ADMIN");

        // Then
        assertTrue(result);
    }

    @Test
    void isValidRoleName_WithInvalidName_ShouldReturnFalse() {
        // When
        boolean result = roleService.isValidRoleName("invalid-role");

        // Then
        assertFalse(result);
    }

    @Test
    void isValidRoleName_WithNullName_ShouldReturnFalse() {
        // When
        boolean result = roleService.isValidRoleName(null);

        // Then
        assertFalse(result);
    }

    @Test
    void getAllRoleNames_ShouldReturnListOfRoleNames() {
        // Given
        Role adminRole = new Role();
        adminRole.setRole("ADMIN");
        List<Role> roles = Arrays.asList(testRole, adminRole);
        when(roleRepository.findAll()).thenReturn(roles);

        // When
        List<String> result = roleService.getAllRoleNames();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.contains("CLIENT"));
        assertTrue(result.contains("ADMIN"));
        verify(roleRepository).findAll();
    }
}