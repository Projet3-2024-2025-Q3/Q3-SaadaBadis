package be.helha.gpdrapp.model;

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

    // Relation simple avec les utilisateurs
    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
    private List<Utilisateur> utilisateurs;

    // Constructeur pour faciliter la création
    public Role(String role) {
        this.role = role;
    }
}