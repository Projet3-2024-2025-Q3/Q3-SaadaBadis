package be.helha.gdprapp.controllers;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.services.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleController {

    @Autowired
    private RoleService roleService;

    // Get all roles
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Role>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    // Get role by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> getRoleById(@PathVariable Integer id) {
        Optional<Role> role = roleService.getRoleById(id);
        return role.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get role by name
    @GetMapping("/name/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> getRoleByName(@PathVariable String roleName) {
        Optional<Role> role = roleService.getRoleByName(roleName);
        return role.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create new role (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createRole(@RequestBody Role role) {
        try {
            if (roleService.existsByRoleName(role.getRole())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Role name already exists!"));
            }
            Role savedRole = roleService.createRole(role);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error creating role: " + e.getMessage()));
        }
    }

    // Update role (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable Integer id, @RequestBody Role roleDetails) {
        try {
            Optional<Role> existingRole = roleService.getRoleById(id);
            if (existingRole.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Check if role name is being changed and if it already exists
            if (!existingRole.get().getRole().equals(roleDetails.getRole())
                    && roleService.existsByRoleName(roleDetails.getRole())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Error: Role name already exists!"));
            }

            Role updatedRole = roleService.updateRole(id, roleDetails);
            return ResponseEntity.ok(updatedRole);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error updating role: " + e.getMessage()));
        }
    }

    // Delete role (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteRole(@PathVariable Integer id) {
        try {
            // Check if role has associated users
            if (roleService.hasAssociatedUsers(id)) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Cannot delete role: It has associated users"));
            }

            roleService.deleteRole(id);
            return ResponseEntity.ok().body(new SuccessResponse("Role deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error deleting role: " + e.getMessage()));
        }
    }

    // Get users count for a specific role
    @GetMapping("/{id}/users/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getUsersCountByRole(@PathVariable Integer id) {
        try {
            long count = roleService.getUsersCountByRole(id);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get role statistics
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoleService.RoleStatistics> getRoleStatistics() {
        RoleService.RoleStatistics stats = roleService.getRoleStatistics();
        return ResponseEntity.ok(stats);
    }

    // Get all role names (for dropdowns)
    @GetMapping("/names")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GERANT')")
    public ResponseEntity<List<String>> getAllRoleNames() {
        List<String> roleNames = roleService.getAllRoleNames();
        return ResponseEntity.ok(roleNames);
    }

    // Create default roles (Admin only)
    @PostMapping("/init-defaults")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDefaultRoles() {
        try {
            roleService.createDefaultRoles();
            return ResponseEntity.ok().body(new SuccessResponse("Default roles created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error creating default roles: " + e.getMessage()));
        }
    }

    // Check if role name is valid
    @GetMapping("/validate/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Boolean> validateRoleName(@PathVariable String roleName) {
        boolean isValid = roleService.isValidRoleName(roleName);
        return ResponseEntity.ok(isValid);
    }

    // Inner classes for responses
    public static class ErrorResponse {
        private String message;
        private String status = "error";

        public ErrorResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class SuccessResponse {
        private String message;
        private String status = "success";

        public SuccessResponse(String message) {
            this.message = message;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}