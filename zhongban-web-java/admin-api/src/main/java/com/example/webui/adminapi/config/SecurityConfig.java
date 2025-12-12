package com.example.webui.adminapi.config;

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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Arrays;

@Configuration
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health", "/api/health").permitAll()
                .requestMatchers("/", "/index.html", "/static/**", "/favicon.ico", "/api/static/**").permitAll()
                .requestMatchers("/admin/auth/login", "/api/admin/auth/login").permitAll()
                .requestMatchers("/admin/auth/bootstrap-admin", "/api/admin/auth/bootstrap-admin").permitAll()
                .requestMatchers("/admin/**", "/api/admin/**").authenticated()
                .anyRequest().permitAll())
            .addFilterBefore(new JwtFilter(jwtSecret), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(corsFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    private CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    static class JwtFilter extends OncePerRequestFilter {
        private final Key key;

        JwtFilter(String secret) {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
            String token = null;
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if ("access_token".equals(c.getName())) {
                        token = c.getValue();
                        break;
                    }
                }
            }
            if (token != null && !token.isBlank()) {
                try {
                    Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
                    String userId = claims.get("userId", String.class);
                    String username = claims.get("username", String.class);
                    if (userId != null && username != null) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(new User(username, "", java.util.List.of()), null, java.util.List.of());
                        // 将userId放入Map中，以便getActorId方法可以正确提取
                        java.util.Map<String, Object> details = new java.util.HashMap<>();
                        details.put("userId", userId);
                        auth.setDetails(details);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                } catch (Exception ignored) {}
            }
            filterChain.doFilter(request, response);
        }
    }
}
