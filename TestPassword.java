import org.springframework.security.crypto.bcrypt.BCrypt;

public class TestPassword {
    public static void main(String[] args) {
        String storedHash = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.";
        String[] testPasswords = {"admin", "admin123", "password", "Abcdef1!", "admin888", "123456"};
        
        System.out.println("测试密码与哈希值匹配:");
        for (String password : testPasswords) {
            boolean matches = BCrypt.checkpw(password, storedHash);
            System.out.println("密码: " + password + " -> " + (matches ? "匹配" : "不匹配"));
        }
    }
}