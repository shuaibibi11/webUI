build:
  maven:
    - mvn -q -f webUI-java/pom.xml -DskipTests package
lint:
  skip: true
typecheck:
  skip: true
