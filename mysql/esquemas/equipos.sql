-- NOVATIX | equipos_db | Normalizado de mysqldump --no-data del 20/11/2026.
-- IMPORTAR UNICAMENTE EN UNA INSTALACION VACIA DE MYSQL 8.0.
-- Sin INSERT, DROP, ALTER, GRANT, CREATE USER, credenciales ni datos personales.
CREATE DATABASE IF NOT EXISTS `equipos_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `equipos_db`;
CREATE TABLE IF NOT EXISTS `equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `pais` varchar(50) NOT NULL,
  `liga` varchar(100) NOT NULL,
  `escudo` varchar(255) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'activo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
