import org.springframework.security.crypto.bcrypt.BCrypt;

public class TestBCrypt {
    public static void main(String[] args) {
        String password = "Abcdef1!";
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(12));
        System.out.println("Password: " + password);
        System.out.println("Hashed: " + hashedPassword);
        
        // 验证密码
        boolean matches = BCrypt.checkpw(password, "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
        System.out.println("Matches existing hash: " + matches);
        
        // 验证新哈希
        boolean matchesNew = BCrypt.checkpw(password, hashedPassword);
        System.out.println("Matches new hash: " + matchesNew);
    }
}