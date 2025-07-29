package be.helha.gdprapp.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_company")
    private Integer idCompany;

    @Column(name = "company_name", length = 50, nullable = false)
    private String companyName;

    @Column(name = "email", length = 50, nullable = false)
    private String email;

    // Constructor for convenience
    public Company(String companyName, String email) {
        this.companyName = companyName;
        this.email = email;
    }
}