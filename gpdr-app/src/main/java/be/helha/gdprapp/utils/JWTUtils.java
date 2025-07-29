package be.helha.gdprapp.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTUtils {

    @Value("${jwt.secret:myVerySecretKeyForJWTTokenGenerationThatShouldBeLongEnoughForHS512}")
    private String secret;

    @Value("${jwt.expirationTokenMs:86400000}")  // 24 hours default
    private long expirationToken;

    @Value("${jwt.expirationRefreshTokenMs:604800000}")  // 7 days default
    private long expirationRefreshToken;

    // Get signing key
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Generate token with UserDetails (for Spring Security)
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().toString());
        return createToken(claims, userDetails.getUsername(), expirationToken);
    }

    // Generate token with our User entity
    public String generateToken(be.helha.gdprapp.models.User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRole().getRole());
        claims.put("userId", user.getIdUser());
        claims.put("active", user.getActive());
        return createToken(claims, user.getEmail(), expirationToken);
    }

    // Generate token with email and role (simple version)
    public String generateToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", role);
        return createToken(claims, email, expirationToken);
    }

    // Create token with claims, subject and expiration
    private String createToken(Map<String, Object> claims, String subject, long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // Extract username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract expiration date from token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Extract specific claim from token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extract all claims from token
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Check if token is expired
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate token with UserDetails
    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (JwtException e) {
            return false;
        }
    }

    // Validate token (basic validation)
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    // Parse token and return claims
    public Claims parseToken(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Get user ID from token
    public Integer getUserIdFromToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("userId", Integer.class);
        } catch (Exception e) {
            return null;
        }
    }

    // Get user role from token
    public String getRoleFromToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("roles", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    // Check if user is active from token
    public Boolean isActiveFromToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("active", Boolean.class);
        } catch (Exception e) {
            return null;
        }
    }
}