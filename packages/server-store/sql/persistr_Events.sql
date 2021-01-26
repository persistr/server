CREATE DATABASE  IF NOT EXISTS `persistr` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `persistr`;
-- MySQL Server version	5.7.12

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Events` (
  `db` binary(16) NOT NULL,
  `ns` binary(16) NOT NULL,
  `stream` binary(16) NOT NULL,
  `id` binary(16) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `version` int(10) unsigned DEFAULT NULL,
  `ts` datetime(6) NOT NULL,
  `meta` json NOT NULL,
  `data` json NOT NULL,
  `type` varchar(100) GENERATED ALWAYS AS (json_unquote(json_extract(`meta`,'$.type'))) VIRTUAL,
  PRIMARY KEY (`db`,`ns`,`stream`,`id`),
  UNIQUE KEY `UNIQUE` (`db`,`ns`,`stream`,`id`),
  KEY `ORDERED` (`db`,`ns`,`stream`,`id`,`ts`),
  KEY `STREAM` (`db`,`ns`,`stream`),
  KEY `NS` (`db`,`ns`),
  KEY `DB` (`db`),
  KEY `VERSION` (`db`,`ns`,`stream`,`version`),
  KEY `DBNSTS` (`db`,`ns`,`ts`),
  KEY `ORDEREDSTREAM` (`db`,`ns`,`stream`,`ts`),
  KEY `TS` (`ts`),
  KEY `TSDBNS` (`ts`,`db`,`ns`),
  KEY `TYPE` (`db`,`ns`,`stream`,`ts`,`type`),
  KEY `NSTYPES` (`db`,`ns`,`type`),
  KEY `NSTYPESTS` (`db`,`ns`,`type`,`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `persistr`.`Events_AFTER_INSERT` AFTER INSERT ON `Events` FOR EACH ROW
BEGIN
    INSERT INTO EventTypes (`db`, `ns`, `stream`, `id`, `type`) VALUES (NEW.`db`, NEW.`ns`, NEW.`stream`, NEW.`id`, NEW.`type`);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `persistr`.`Events_AFTER_UPDATE` AFTER UPDATE ON `Events` FOR EACH ROW
BEGIN
    UPDATE EventTypes SET `db` = NEW.`db`, `ns` = NEW.`ns`, `stream` = NEW.`stream`, `id` = NEW.`id`, `type` = NEW.`type` WHERE `db` = OLD.`db` AND `ns` = OLD.`ns` AND `stream` = OLD.`stream` AND `id` = OLD.`id`;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER `persistr`.`Events_AFTER_DELETE` AFTER DELETE ON `Events` FOR EACH ROW
BEGIN
    DELETE FROM EventTypes WHERE `db` = OLD.`db` AND `ns` = OLD.`ns` AND `stream` = OLD.`stream` AND `id` = OLD.`id`;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
