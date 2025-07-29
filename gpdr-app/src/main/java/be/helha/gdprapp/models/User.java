package be.helha.gdprapp.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_user")
    private Integer idUser;

    @Column(name = "firstname", length = 50, nullable = false)
    private String firstname;

    @Column(name = "lastname", length = 50, nullable = false)
    private String lastname;

    @Column(name = "email", length = 50, nullable = false, unique = true)
    private String email;

    @Column(name = "password", length = 100, nullable = false)
    @JsonIgnore  // Ne jamais exposer le mot de passe dans les réponses JSON
    private String password;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    // Simple relation with Role - GARDÉE (pas de problème circulaire car ManyToOne)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_role", nullable = false)
    private Role role;

    // Optional relation with Company - GARDÉE (pas de problème circulaire car ManyToOne)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_company", nullable = true)
    private Company company;

    // Relation inverse avec GDPRRequest - IGNORÉE pour éviter les références circulaires
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<GDPRRequest> gdprRequests;

    // Constructor for convenience (without company)
    public User(String firstname, String lastname, String email, String password, Role role) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.role = role;
        this.active = true;
    }

    // Constructor with company
    public User(String firstname, String lastname, String email, String password, Role role, Company company) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.role = role;
        this.company = company;
        this.active = true;
    }
}