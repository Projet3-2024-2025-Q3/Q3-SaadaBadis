package be.helha.gpdrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "gdpr_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GDPRRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_request")
    private Integer idRequest;

    @Column(name = "request_type", nullable = false)
    private String requestType; // "MODIFICATION" or "DELETION"

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // "PENDING", "PROCESSED"

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate = LocalDateTime.now();

    @Column(name = "request_content", length = 150)
    private String requestContent;

    // Simple relations with foreign keys
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_company", nullable = false)
    private Company company;

    // Constructor for convenience
    public GDPRRequest(String requestType, String requestContent, User user, Company company) {
        this.requestType = requestType;
        this.requestContent = requestContent;
        this.user = user;
        this.company = company;
        this.requestDate = LocalDateTime.now();
        this.status = "PENDING";
    }
}