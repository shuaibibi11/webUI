import org.springframework.security.crypto.bcrypt.BCrypt;

public class GenerateCorrectHash {
    public static void main(String[] args) {
        String password = "Abcdef1!";
        String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
        System.out.println("Password: " + password);
        System.out.println("Hash: " + hash);
        
        // 验证哈希是否正确
        boolean checkResult = BCrypt.checkpw(password, hash);
        System.out.println("Verification result: " + checkResult);
    }
}