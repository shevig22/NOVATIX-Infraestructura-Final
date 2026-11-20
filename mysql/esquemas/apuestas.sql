-- NOVATIX | apuestas_db | Normalizado de mysqldump --no-data del 20/11/2026.
-- IMPORTAR UNICAMENTE EN UNA INSTALACION VACIA DE MYSQL 8.0.
-- Sin INSERT, DROP, ALTER, GRANT, CREATE USER, credenciales ni datos personales.
CREATE DATABASE IF NOT EXISTS `apuestas_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `apuestas_db`;
CREATE TABLE IF NOT EXISTS `apuestas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `part_id` int NOT NULL,
  `equipo_id` int NOT NULL,
  `dinero_apostado` decimal(10,2) NOT NULL,
  `cuota` decimal(5,2) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `resultado` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
