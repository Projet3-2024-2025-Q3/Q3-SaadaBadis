package be.helha.gdprapp.configuration;

import be.helha.gdprapp.models.Role;
import be.helha.gdprapp.repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Create default roles if they don't exist
        if (roleRepository.findByRole("ADMIN").isEmpty()) {
            Role adminRole = new Role("ADMIN");
            roleRepository.save(adminRole);
            System.out.println("Created ADMIN role");
        }

        if (roleRepository.findByRole("CLIENT").isEmpty()) {
            Role clientRole = new Role("CLIENT");
            roleRepository.save(clientRole);
            System.out.println("Created CLIENT role");
        }

        if (roleRepository.findByRole("GERANT").isEmpty()) {
            Role gerantRole = new Role("GERANT");
            roleRepository.save(gerantRole);
            System.out.println("Created GERANT role");
        }
    }
}