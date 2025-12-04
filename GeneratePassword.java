import org.springframework.security.crypto.bcrypt.BCrypt;

public class GeneratePassword {
    public static void main(String[] args) {
        String password = "Abcdef1!";
        String hashed = BCrypt.hashpw(password, BCrypt.gensalt(12));
        System.out.println("Hashed password: " + hashed);
        
        // Verify the hash
        boolean check = BCrypt.checkpw(password, hashed);
        System.out.println("Password check: " + check);
    }
}