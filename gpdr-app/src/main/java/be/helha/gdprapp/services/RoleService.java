package be.helha.gdprapp.services;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.repositories.RoleRepository;
import be.helha.gdprapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all roles
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    // Get role by ID
    public Optional<Role> getRoleById(Integer id) {
        return roleRepository.findById(id);
    }

    // Get role by name
    public Optional<Role> getRoleByName(String roleName) {
        return roleRepository.findByRole(roleName);
    }

    // Check if role name exists
    public boolean existsByRoleName(String roleName) {
        return roleRepository.findByRole(roleName).isPresent();
    }

    // Create new role
    public Role createRole(Role role) {
        // Validate role name
        if (role.getRole() == null || role.getRole().trim().isEmpty()) {
            throw new RuntimeException("Role name cannot be empty");
        }

        // Convert to uppercase for consistency
        role.setRole(role.getRole().toUpperCase().trim());

        // Check if role already exists
        if (existsByRoleName(role.getRole())) {
            throw new RuntimeException("Role with name '" + role.getRole() + "' already exists");
        }

        return roleRepository.save(role);
    }

    // Update role
    public Role updateRole(Integer id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        // Update role name if provided
        if (roleDetails.getRole() != null && !roleDetails.getRole().trim().isEmpty()) {
            String newRoleName = roleDetails.getRole().toUpperCase().trim();

            // Check if new role name already exists (and it's not the same role)
            if (!role.getRole().equals(newRoleName) && existsByRoleName(newRoleName)) {
                throw new RuntimeException("Role with name '" + newRoleName + "' already exists");
            }

            role.setRole(newRoleName);
        }

        return roleRepository.save(role);
    }

    // Delete role
    public void deleteRole(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        // Check if role has associated users
        if (hasAssociatedUsers(id)) {
            throw new RuntimeException("Cannot delete role: It has associated users");
        }

        // Prevent deletion of essential roles
        if (role.getRole().equals("ADMIN") || role.getRole().equals("CLIENT") || role.getRole().equals("GERANT")) {
            throw new RuntimeException("Cannot delete essential system role: " + role.getRole());
        }

        roleRepository.deleteById(id);
    }

    // Check if role has associated users
    public boolean hasAssociatedUsers(Integer roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        return !userRepository.findByRole(role).isEmpty();
    }

    // Get users count by role
    public long getUsersCountByRole(Integer roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        return userRepository.findByRole(role).size();
    }

    // Get users count by role name
    public long getUsersCountByRoleName(String roleName) {
        return userRepository.findByRoleRole(roleName).size();
    }

    // Create default roles if they don't exist
    public void createDefaultRoles() {
        // Create ADMIN role if it doesn't exist
        if (!existsByRoleName("ADMIN")) {
            Role adminRole = new Role("ADMIN");
            roleRepository.save(adminRole);
        }

        // Create CLIENT role if it doesn't exist
        if (!existsByRoleName("CLIENT")) {
            Role clientRole = new Role("CLIENT");
            roleRepository.save(clientRole);
        }

        // Create GERANT role if it doesn't exist
        if (!existsByRoleName("GERANT")) {
            Role gerantRole = new Role("GERANT");
            roleRepository.save(gerantRole);
        }
    }

    // Get role statistics
    public RoleStatistics getRoleStatistics() {
        List<Role> allRoles = getAllRoles();
        long totalRoles = allRoles.size();
        long totalUsers = userRepository.count();

        RoleStatistics stats = new RoleStatistics();
        stats.setTotalRoles(totalRoles);
        stats.setTotalUsers(totalUsers);

        // Calculate users per role
        for (int i = 0; i < allRoles.size(); i++) {
            Role role = allRoles.get(i);
            long usersInRole = getUsersCountByRole(role.getIdRole());
            stats.addRoleUserCount(role.getRole(), usersInRole);
        }

        return stats;
    }

    // Validate role name format
    public boolean isValidRoleName(String roleName) {
        if (roleName == null || roleName.trim().isEmpty()) {
            return false;
        }

        // Role name should only contain letters, numbers, and underscores
        return roleName.matches("^[A-Z_][A-Z0-9_]*$");
    }

    // Get all available role names
    public List<String> getAllRoleNames() {
        List<Role> roles = roleRepository.findAll();
        java.util.List<String> roleNames = new java.util.ArrayList<>();
        for (int i = 0; i < roles.size(); i++) {
            roleNames.add(roles.get(i).getRole());
        }
        return roleNames;
    }

    // Inner class for role statistics
    public static class RoleStatistics {
        private long totalRoles;
        private long totalUsers;
        private java.util.Map<String, Long> roleUserCounts = new java.util.HashMap<>();

        // Getters and setters
        public long getTotalRoles() { return totalRoles; }
        public void setTotalRoles(long totalRoles) { this.totalRoles = totalRoles; }

        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

        public java.util.Map<String, Long> getRoleUserCounts() { return roleUserCounts; }
        public void setRoleUserCounts(java.util.Map<String, Long> roleUserCounts) { this.roleUserCounts = roleUserCounts; }

        public void addRoleUserCount(String roleName, Long count) {
            this.roleUserCounts.put(roleName, count);
        }
    }
}