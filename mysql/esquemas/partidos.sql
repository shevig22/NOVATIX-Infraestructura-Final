-- NOVATIX | partidos_db | Normalizado de mysqldump --no-data del 20/11/2026.
-- IMPORTAR UNICAMENTE EN UNA INSTALACION VACIA DE MYSQL 8.0.
-- Sin INSERT, DROP, ALTER, GRANT, CREATE USER, credenciales ni datos personales.
CREATE DATABASE IF NOT EXISTS `partidos_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `partidos_db`;
CREATE TABLE IF NOT EXISTS `partidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_equipo_local` int NOT NULL,
  `id_equipo_visitante` int NOT NULL,
  `equipo_local_nombre` varchar(100) NOT NULL,
  `equipo_visitante_nombre` varchar(100) NOT NULL,
  `escudo_local` varchar(255) DEFAULT NULL,
  `escudo_visitante` varchar(255) DEFAULT NULL,
  `fecha_partido` datetime NOT NULL,
  `cuota_local` decimal(5,2) NOT NULL,
  `cuota_empate` decimal(5,2) NOT NULL,
  `cuota_visitante` decimal(5,2) NOT NULL,
  `goles_local` int DEFAULT '0',
  `goles_visitante` int DEFAULT '0',
  `estado` varchar(20) DEFAULT 'programado',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
