package com.diplomski.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    private SecretKey getSigningKey(){
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String username){
        return generateAccessToken(username, accessTokenExpiration);
    }

    public String generateAccessToken(String username, long expirationMs){
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromToken(String token){
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token){
        try {
            parseClaims(token);
            return true;
        }catch (ExpiredJwtException e) {
            System.out.println("Token istekao: " + e.getMessage());
        }catch (UnsupportedJwtException e) {
            System.out.println("Token nije podrzan: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.out.println("Token je malformiran: " + e.getMessage());
        } catch (SecurityException e) {
            System.out.println("Neispravan potpis: " + e.getMessage());
        }
        return false;

    }

    public boolean isTokenExpired(String token){
        try{
            return parseClaims(token).getExpiration().before(new Date());
        }catch (ExpiredJwtException e){
            return true;
        }
    }

    private Claims parseClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
