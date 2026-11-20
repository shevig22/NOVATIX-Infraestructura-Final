-- NOVATIX | dinero_db | Normalizado de mysqldump --no-data del 20/11/2026.
-- IMPORTAR UNICAMENTE EN UNA INSTALACION VACIA DE MYSQL 8.0.
-- Sin INSERT, DROP, ALTER, GRANT, CREATE USER, credenciales ni datos personales.
CREATE DATABASE IF NOT EXISTS `dinero_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `dinero_db`;
CREATE TABLE IF NOT EXISTS `dinero` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `saldo_real` decimal(10,2) NOT NULL DEFAULT '0.00',
  `saldo_congelado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `saldo_disponible` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tipo` varchar(50) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `saldo_antes` decimal(10,2) NOT NULL,
  `saldo_despues` decimal(10,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'completada',
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
