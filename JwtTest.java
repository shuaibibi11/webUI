import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class JwtTest {
    public static void main(String[] args) {
        // 使用与SecurityConfig相同的密钥
        String secret = "your-secret-key-change-in-production";
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        
        // 创建claims
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "1");
        claims.put("username", "admin");
        claims.put("role", "ADMIN"); // 添加role信息
        
        // 生成JWT token
        String token = Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000)) // 1小时后过期
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        
        System.out.println("New JWT Token:");
        System.out.println(token);
        
        // 验证token
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            System.out.println("Token is valid");
        } catch (Exception e) {
            System.out.println("Token validation failed: " + e.getMessage());
        }
    }
}