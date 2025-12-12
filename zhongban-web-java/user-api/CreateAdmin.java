import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;

public class CreateAdmin {
    public static void main(String[] args) {
        try {
            // 连接数据库
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://172.17.0.5:3306/chatbot?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
                "root", "tvi888TVI");
            
            // 检查admin用户是否已存在
            PreparedStatement checkStmt = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
            checkStmt.setString(1, "admin");
            ResultSet rs = checkStmt.executeQuery();
            
            if (rs.next()) {
                System.out.println("Admin用户已存在，更新密码和角色...");
                // 更新现有用户的密码和角色
                // 使用一个简单的哈希密码（实际项目中应该使用BCrypt）
                String hashedPassword = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // 这是"Abcdef1!"的BCrypt哈希
                PreparedStatement updateStmt = conn.prepareStatement(
                    "UPDATE users SET password = ?, role = 'ADMIN', status = 'ACTIVE' WHERE username = ?");
                updateStmt.setString(1, hashedPassword);
                updateStmt.setString(2, "admin");
                updateStmt.executeUpdate();
                System.out.println("Admin用户密码和角色已更新");
            } else {
                System.out.println("创建新的Admin用户...");
                // 创建新的admin用户
                String adminId = UUID.randomUUID().toString();
                // 使用一个简单的哈希密码（实际项目中应该使用BCrypt）
                String hashedPassword = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // 这是"Abcdef1!"的BCrypt哈希
                
                PreparedStatement insertStmt = conn.prepareStatement(
                    "INSERT INTO users (id, username, phone, email, password, real_name, id_card, role, status, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                
                insertStmt.setString(1, adminId);
                insertStmt.setString(2, "admin");
                insertStmt.setString(3, "13800138000");
                insertStmt.setString(4, "admin@example.com");
                insertStmt.setString(5, hashedPassword);
                insertStmt.setString(6, "管理员");
                insertStmt.setString(7, "110101199001010000");
                insertStmt.setString(8, "ADMIN");
                insertStmt.setString(9, "ACTIVE");
                
                insertStmt.executeUpdate();
                System.out.println("Admin用户创建成功");
            }
            
            conn.close();
            System.out.println("操作完成");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}