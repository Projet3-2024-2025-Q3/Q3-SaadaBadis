package be.helha.gdprapp.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JWTUtils {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expirationTokenMs}")
    private long expirationToken;

    @Value("${jwt.expirationRefreshTokenMs}")
    private long expirationRefreshToken;


    public String generateAccessToken(org.springframework.security.core.userdetails.User user){
        return generateToken(user,expirationToken);
    }

    public String generateRefreshToken(org.springframework.security.core.userdetails.User user){
        return generateToken(user,expirationRefreshToken);
    }

    private String generateToken(User user, long expiration) {
        return Jwts.builder()
                .claims(Jwts.claims()
                        .subject(user.getUsername())
                        .issuedAt(new Date())
                        .expiration(new Date(new Date().getTime()+expiration))
                        .add("roles",user.getAuthorities())
                        .build())
                .signWith(SignatureAlgorithm.HS512,secret).compact();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        }catch (JwtException e){
            return false;
        }
    }

    public Claims parseToken(String token) throws JwtException {
        return Jwts.parser().setSigningKey(secret).build().parseClaimsJws(token).getPayload();
    }

}