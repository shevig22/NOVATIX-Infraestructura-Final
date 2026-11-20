-- NOVATIX | usuarios_db | Normalizado de mysqldump --no-data del 20/11/2026.
-- IMPORTAR UNICAMENTE EN UNA INSTALACION VACIA DE MYSQL 8.0.
-- Sin INSERT, DROP, ALTER, GRANT, CREATE USER, credenciales ni datos personales.
CREATE DATABASE IF NOT EXISTS `usuarios_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `usuarios_db`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(20) DEFAULT 'activo',
  `rol` varchar(20) DEFAULT 'cliente',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
