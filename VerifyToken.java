import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;

public class VerifyToken {
    public static void main(String[] args) {
        String token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc2NDczMjY0MywiZXhwIjoxNzY0NzM2MjQzfQ.nMfH1fiMTnyTbujVv7Oqar9jVheglyvASY-Ov596-0A";
        String secret = "your-secret-key-change-in-production";
        
        Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            System.out.println("Token is valid");
            System.out.println("UserId: " + claims.get("userId", String.class));
            System.out.println("Username: " + claims.get("username", String.class));
            System.out.println("Role: " + claims.get("role", String.class));
            System.out.println("All claims: " + claims);
        } catch (Exception e) {
            System.out.println("Token validation failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}