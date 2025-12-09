package com.example.webui.userapi.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/users/login", "/users/register", "/users/password-reset/**",
                            "/api/users/login", "/api/users/register", "/api/users/password-reset/**",
                            "/user/auth/login", "/api/user/auth/login",
                            "/users/bootstrap-admin", "/api/users/bootstrap-admin",
                            "/users/check-username", "/users/check-phone", "/users/check-idcard",
                            "/api/users/check-username", "/api/users/check-phone", "/api/users/check-idcard",
                            "/health", "/api/health").permitAll()
                .requestMatchers("/api/messages/**", "/api/conversations/**", "/api/feedbacks/**").authenticated()
                .requestMatchers("/users/**", "/api/users/**").authenticated()
                .anyRequest().permitAll())
            .addFilterBefore(new JwtFilter(jwtSecret), AuthorizationFilter.class);
        return http.build();
    }

    class JwtFilter extends OncePerRequestFilter {
        private final Key key;

        JwtFilter(String secret) {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            logger.info("JWT Filter initialized with secret: " + secret);
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
            String token = null;
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            
            logger.info("Processing request: " + request.getMethod() + " " + request.getRequestURI());
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                logger.info("Found Bearer token in Authorization header");
            } else if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if ("access_token".equals(c.getName())) {
                        token = c.getValue();
                        logger.info("Found token in access_token cookie");
                        break;
                    }
                }
            }
            
            if (token != null && !token.isBlank()) {
                try {
                    logger.info("Attempting to parse JWT token");
                    Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
                    String userId = claims.get("userId", String.class);
                    String username = claims.get("username", String.class);
                    String role = claims.get("role", String.class);
                    
                    logger.info("JWT parsed successfully. UserId: " + userId + ", Username: " + username + ", Role: " + role);
                    
                    if (userId != null && username != null) {
                        // Create authorities list with ROLE_USER
                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                        
                        // Add admin role if user is admin
                        if ("ADMIN".equals(role)) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }
                        
                        // Create a Map with user details
                        Map<String, Object> userDetails = new HashMap<>();
                        userDetails.put("userId", userId);
                        userDetails.put("username", username);
                        userDetails.put("role", role);
                        
                        // Create authentication token with user and authorities
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
                        auth.setDetails(userDetails);
                        
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        logger.info("Authentication set in SecurityContext with authorities: " + authorities);
                        
                        // Verify authentication was set correctly
                        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
                        logger.info("Current authentication after setting: " + (currentAuth != null ? currentAuth.getName() : "null"));
                        
                        // Verify details are set correctly
                        if (currentAuth != null && currentAuth.getDetails() != null) {
                            logger.info("Authentication details: " + currentAuth.getDetails());
                        } else {
                            logger.error("Authentication details are null!");
                        }
                    }
                } catch (Exception e) {
                    // Log the error for debugging
                    logger.error("JWT parsing failed: " + e.getMessage(), e);
                }
            } else {
                logger.warn("No token found in request");
            }
            
            // Log authentication before passing to next filter
            Authentication authBefore = SecurityContextHolder.getContext().getAuthentication();
            logger.info("Authentication before filter chain: " + (authBefore != null ? authBefore.getName() : "null"));
            
            filterChain.doFilter(request, response);
            
            // Log authentication after returning from filter chain
            Authentication authAfter = SecurityContextHolder.getContext().getAuthentication();
            logger.info("Authentication after filter chain: " + (authAfter != null ? authAfter.getName() : "null"));
        }
    }
}