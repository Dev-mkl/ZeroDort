# Etapa de Build (Compilação)
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Etapa de Execução (Rodar a aplicação)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta padrão (o Render sobrescreve com a variável PORT)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]