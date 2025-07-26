package be.helha.gdprapp.configuration;

import be.helha.gdprapp.security.JWTFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SpringSecurityConfig {

    @Autowired
    private JWTFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    // Public endpoints
                    auth.requestMatchers("/api/auth/**").permitAll(); // Login/Register
                    auth.requestMatchers("/api/companies/list").permitAll(); // Company list for clients
                    auth.requestMatchers("/h2-console/**").permitAll(); // H2 Console
                    auth.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll(); // Swagger

                    // UC1 - CLIENT: GDPR requests management
                    auth.requestMatchers("/api/gdpr/my-requests").hasRole("CLIENT");
                    auth.requestMatchers("/api/gdpr/create").hasRole("CLIENT");

                    // UC2 - GERANT: Process GDPR requests
                    auth.requestMatchers("/api/gdpr/company/**").hasRole("GERANT");
                    auth.requestMatchers("/api/gdpr/process/**").hasRole("GERANT");
                    auth.requestMatchers("/api/gdpr/history").hasRole("GERANT");

                    // UC3 - ADMIN: User management
                    auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
                    auth.requestMatchers("/api/users/**").hasRole("ADMIN");

                    // Any other request requires authentication
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions().disable()) // For H2 Console
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

// Dans votre SpringSecurityConfig.java, remplacez la méthode corsConfigurationSource par :

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Autoriser toutes les origines pour les tests (à modifier en production)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // Autoriser tous les headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Autoriser toutes les méthodes HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Autoriser les credentials
        configuration.setAllowCredentials(true);

        // Exposer les headers d'autorisation
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Configurer le cache preflight
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}