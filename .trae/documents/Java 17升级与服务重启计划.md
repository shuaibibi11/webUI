# Java 17升级与服务重启计划

## 一、Java 17升级步骤

### 1. 检查当前Java版本
```bash
java -version
```

### 2. 安装Java 17
```bash
# 使用apt安装OpenJDK 17
sudo apt update
sudo apt install -y openjdk-17-jdk openjdk-17-jre

# 验证安装结果
sudo update-alternatives --list java
```

### 3. 更新环境变量
```bash
# 设置Java 17为默认版本
sudo update-alternatives --config java

# 更新JAVA_HOME和PATH环境变量
echo 'export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:bin/java::")' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 4. 验证Java版本升级结果
```bash
java -version
javac -version
```

### 5. 修改项目配置文件
```bash
# 修改pom.xml，将Java版本设置为17
vi /data/webUI-java/pom.xml

# 修改内容：
<properties>
  <spring.boot.version>3.2.1</spring.boot.version>
  <java.version>17</java.version>
</properties>

# 将实体类中的javax.persistence替换为jakarta.persistence
find /data/webUI-java/common -name "*.java" -exec sed -i 's/import javax.persistence/import jakarta.persistence/g' {}\;
```

### 6. 重新编译项目
```bash
cd /data/webUI-java
mvn clean package -DskipTests
```

## 二、服务重启流程

### 1. 停止所有相关Docker容器
```bash
# 停止占用指定端口的Docker容器
docker ps | grep -E '13080|13081|13082|13088' | awk '{print $1}' | xargs -r docker stop
```

### 2. 停止所有前端服务进程
```bash
# 停止占用13082端口的进程
fuser -k 13082/tcp
```

### 3. 停止所有后端服务进程
```bash
# 停止占用13088端口的进程
fuser -k 13088/tcp
```

### 4. 重新启动Docker容器
```bash
# 启动所有Docker容器
docker-compose up -d
```

### 5. 重新启动后端服务
```bash
# 启动user-api服务
java -jar /data/webUI-java/user-api/target/user-api-1.0.0.jar &

# 启动admin-api服务
java -jar /data/webUI-java/admin-api/target/admin-api-1.0.0.jar &
```

### 6. 重新启动前端服务
```bash
# 启动user-web服务
cd /data/webUI-java/user-web
npm run dev &

# 启动admin-web服务
cd /data/webUI-java/admin-web
npm run dev &
```

## 三、验证操作结果

### 1. 检查服务状态
```bash
# 检查Docker容器状态
docker ps

# 检查端口占用情况
ss -tulnp | grep -E '13080|13081|13082|13088'
```

### 2. 验证服务可访问性
```bash
# 测试前端服务
curl -I http://localhost:13080

# 测试后端API
curl -I http://localhost:13088/api/users
```

### 3. 验证Java 17环境
```bash
# 检查Java版本
java -version

# 检查服务日志中的Java版本
docker logs webui-java-user-api-1 | grep -i java
```

### 4. 执行基础功能测试
```bash
# 测试登录功能
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"Abcdef1!"}' http://localhost:13088/api/users/login
```

## 四、预期结果

1. Java版本成功升级到17
2. 所有服务成功启动，无错误日志
3. 各端口服务可正常访问
4. Java 17环境在所有服务中正确应用
5. 基础功能测试通过，系统正常运行