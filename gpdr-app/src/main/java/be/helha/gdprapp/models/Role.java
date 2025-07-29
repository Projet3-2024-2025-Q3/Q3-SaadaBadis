package be.helha.gdprapp.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_role")
    private Integer idRole;

    @Column(name = "role", length = 10, nullable = false, unique = true)
    private String role;

    // Simple relation with users
    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
    private List<User> users;

    // Constructor for easy creation
    public Role(String role) {
        this.role = role;
    }
}