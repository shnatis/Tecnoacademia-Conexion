-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para tecnoacademia2
CREATE DATABASE IF NOT EXISTS `tecnoacademia2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `tecnoacademia2`;

-- Volcando estructura para tabla tecnoacademia2.aprendices
CREATE TABLE IF NOT EXISTS `aprendices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lista_id` int(11) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `institucion` varchar(255) DEFAULT NULL,
  `documento` varchar(50) DEFAULT NULL,
  `profesora_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lista_id` (`lista_id`),
  KEY `fk_profesora` (`profesora_id`),
  CONSTRAINT `aprendices_ibfk_1` FOREIGN KEY (`lista_id`) REFERENCES `listas_asistencia` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profesora` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.asistencias
CREATE TABLE IF NOT EXISTS `asistencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aprendiz_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `presente` tinyint(1) DEFAULT 0,
  `profesora_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aprendiz_id` (`aprendiz_id`,`fecha`),
  KEY `fk_profesora_id` (`profesora_id`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`aprendiz_id`) REFERENCES `aprendices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profesora_id` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1297 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.asistencias_aprendices
CREATE TABLE IF NOT EXISTS `asistencias_aprendices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aprendiz_id` int(11) NOT NULL,
  `profesora_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `presente` tinyint(1) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `_aprendiz_fecha_uc` (`aprendiz_id`,`fecha`),
  KEY `profesora_id` (`profesora_id`),
  KEY `ix_asistencias_aprendices_id` (`id`),
  CONSTRAINT `asistencias_aprendices_ibfk_1` FOREIGN KEY (`aprendiz_id`) REFERENCES `aprendices` (`id`),
  CONSTRAINT `asistencias_aprendices_ibfk_2` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.asistencias_profesoras
CREATE TABLE IF NOT EXISTS `asistencias_profesoras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesora_id` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  `presente` tinyint(1) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `_profesora_fecha_uc` (`profesora_id`,`fecha`),
  KEY `ix_asistencias_profesoras_id` (`id`),
  CONSTRAINT `asistencias_profesoras_ibfk_1` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.clases
CREATE TABLE IF NOT EXISTS `clases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesora_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ubicacion` varchar(100) NOT NULL COMMENT 'Colegio o Centro TecnoAcademia',
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `activa` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_profesora_fecha` (`profesora_id`,`fecha_inicio`),
  KEY `idx_fecha_inicio` (`fecha_inicio`),
  KEY `idx_ubicacion` (`ubicacion`),
  KEY `idx_activa` (`activa`),
  CONSTRAINT `clases_ibfk_1` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `CONSTRAINT_1` CHECK (`fecha_fin` > `fecha_inicio`),
  CONSTRAINT `CONSTRAINT_2` CHECK (`ubicacion` in ('Colegio','Centro TecnoAcademia'))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.listas_asistencia
CREATE TABLE IF NOT EXISTS `listas_asistencia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profesora_id` int(11) NOT NULL,
  `nombre_lista` varchar(255) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `profesora_id` (`profesora_id`),
  CONSTRAINT `listas_asistencia_ibfk_1` FOREIGN KEY (`profesora_id`) REFERENCES `profesoras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tecnoacademia2.profesoras
CREATE TABLE IF NOT EXISTS `profesoras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `especialidad` varchar(100) NOT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `activa` tinyint(1) DEFAULT 1,
  `is_admin` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_activa` (`activa`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
