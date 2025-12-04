import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public class TestJwtSignature {
    public static void main(String[] args) {
        // 使用与系统相同的密钥
        String jwtSecret = "your-secret-key-change-in-production";
        
        // 创建签名密钥
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        // 生成JWT令牌
        String token = Jwts.builder()
                .setSubject("test-user")
                .claim("userId", 1L)
                .claim("username", "testuser")
                .claim("role", "USER")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000)) // 1小时后过期
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
                
        System.out.println("Generated token: " + token);
        
        // 验证JWT令牌
        try {
            Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
                    
            System.out.println("Token validation successful!");
            System.out.println("User ID: " + claims.getBody().get("userId"));
            System.out.println("Username: " + claims.getBody().get("username"));
            System.out.println("Role: " + claims.getBody().get("role"));
        } catch (JwtException e) {
            System.err.println("Token validation failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}