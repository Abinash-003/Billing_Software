-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mnb_data
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `mnb_data`
--

-- CREATE DATABASE commented out for cloud migration

-- USE mnb_data commented out for cloud migration

--
-- Table structure for table `bill_items`
--

DROP TABLE IF EXISTS `bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `gst_amount` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bill_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_items`
--

LOCK TABLES `bill_items` WRITE;
/*!40000 ALTER TABLE `bill_items` DISABLE KEYS */;
INSERT INTO `bill_items` VALUES (1,1,1,5,25.00,0.00,125.00),(2,2,2,5,40.00,0.00,200.00),(3,3,2,5,40.00,0.00,200.00),(4,4,3,1,27.00,0.00,27.00),(5,5,4,3,45.00,0.00,135.00),(6,6,3,2,27.00,0.00,54.00),(7,7,3,2,27.00,0.00,54.00),(8,8,3,1,27.00,0.00,27.00),(9,9,11,15,20.00,36.00,336.00),(10,10,4,2,45.00,0.00,90.00),(11,11,5,2,42.00,0.00,84.00),(12,12,8,23,14.00,38.64,360.64),(13,13,3,9,27.00,0.00,243.00),(14,13,5,4,42.00,0.00,168.00),(15,14,3,1,27.00,0.00,27.00),(16,15,6,10,120.00,60.00,1260.00),(17,16,3,1,27.00,0.00,27.00),(18,17,3,1,27.00,0.00,27.00),(19,18,3,1,27.00,0.00,27.00),(20,19,8,1,14.00,1.68,15.68),(21,20,8,2,14.00,3.36,31.36);
/*!40000 ALTER TABLE `bill_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(20) NOT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(15) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `grand_total` decimal(10,2) NOT NULL,
  `cashier_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bill_number` (`bill_number`),
  KEY `cashier_id` (`cashier_id`),
  KEY `idx_bill_date` (`created_at`),
  CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,'SB-7068-421390','zz','6374024743',125.00,0.00,0.00,125.00,1,'2026-01-17 09:50:21'),(2,'SB-8533-184258','abi','888888888',200.00,0.00,0.00,200.00,1,'2026-01-17 10:19:44'),(3,'SB-1664-682084','jghg','2345678',200.00,0.00,0.00,200.00,1,'2026-01-17 10:28:02'),(4,'SB-7190-946856','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-11 08:52:26'),(5,'SB-1475-126343','Walk-in Customer','N/A',135.00,0.00,0.00,135.00,1,'2026-02-11 10:18:46'),(6,'SB-8820-183463','Walk-in Customer','N/A',54.00,0.00,0.00,54.00,1,'2026-02-11 10:36:23'),(7,'SB-6186-206153','Walk-in Customer','N/A',54.00,0.00,0.00,54.00,1,'2026-02-11 10:36:46'),(8,'SB-9298-834111','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-11 10:47:14'),(9,'SB-9206-852378','Walk-in Customer','N/A',300.00,36.00,0.00,336.00,1,'2026-02-11 10:47:32'),(10,'SB-1225-104104','Walk-in Customer','N/A',90.00,0.00,0.00,90.00,1,'2026-02-11 10:51:44'),(11,'SB-2298-124966','Walk-in Customer','N/A',84.00,0.00,0.00,84.00,1,'2026-02-11 10:52:04'),(12,'SB-5616-137641','Walk-in Customer','N/A',322.00,38.64,0.00,360.64,1,'2026-02-11 10:52:17'),(13,'SB-7841-364499','Walk-in Customer','N/A',411.00,0.00,0.00,411.00,1,'2026-02-11 12:02:44'),(14,'SB-5838-374717','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-11 12:02:54'),(15,'SB-8001-382455','Walk-in Customer','N/A',1200.00,60.00,0.00,1260.00,1,'2026-02-11 12:03:02'),(16,'SB-5895-950060','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-12 08:12:30'),(17,'SB-9007-965192','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-12 08:12:45'),(18,'SB-7947-010027','Walk-in Customer','N/A',27.00,0.00,0.00,27.00,1,'2026-02-12 08:13:30'),(19,'SB-1269-451772','Walk-in Customer','N/A',14.00,1.68,0.00,15.68,1,'2026-02-12 08:20:51'),(20,'SB-6549-464354','Walk-in Customer','N/A',28.00,3.36,0.00,31.36,1,'2026-02-12 08:21:04');
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distributor_order_items`
--

DROP TABLE IF EXISTS `distributor_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distributor_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order_items` (`order_id`),
  CONSTRAINT `distributor_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `distributor_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `distributor_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distributor_order_items`
--

LOCK TABLES `distributor_order_items` WRITE;
/*!40000 ALTER TABLE `distributor_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `distributor_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distributor_orders`
--

DROP TABLE IF EXISTS `distributor_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distributor_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `ordered_date` date DEFAULT NULL,
  `delivered_date` date DEFAULT NULL,
  `delivery_status` enum('Pending','Delivered','Cancelled') DEFAULT 'Pending',
  `invoice_number` varchar(80) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `balance_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('Paid','Partial','Unpaid') DEFAULT 'Unpaid',
  `notes` text,
  `bill_file_url` varchar(512) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_supplier_orders` (`supplier_id`),
  KEY `idx_order_dates` (`ordered_date`,`delivered_date`),
  CONSTRAINT `distributor_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distributor_orders`
--

LOCK TABLES `distributor_orders` WRITE;
/*!40000 ALTER TABLE `distributor_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `distributor_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `quantity` int DEFAULT '0',
  `stocks` int NOT NULL,
  `unit` enum('kg','ltr','ml','packet','pcs') NOT NULL DEFAULT 'pcs',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'milk','dairy',25.00,0.00,500,45,'ml',0.00,'2026-01-17 09:48:17','2026-01-17 09:50:21'),(2,'juice ','cooldrinks',40.00,0.00,500,90,'ml',0.00,'2026-01-17 09:56:46','2026-01-17 10:28:02'),(3,'Amul Taaza Milk','Dairy',27.00,0.00,500,31,'ml',0.00,'2026-01-17 10:31:52','2026-02-12 08:13:30'),(4,'Britannia Milk Bread','Bakery',45.00,0.00,1,25,'packet',0.00,'2026-01-17 10:31:52','2026-02-11 10:51:44'),(5,'Farm Fresh Eggs (6s)','Dairy',42.00,0.00,6,94,'pcs',0.00,'2026-01-17 10:31:52','2026-02-11 12:02:44'),(6,'Daawat Basmati Rice','Grains',120.00,0.00,1,190,'kg',5.00,'2026-01-17 10:31:52','2026-02-11 12:03:02'),(7,'Aashirvaad Atta','Grains',58.00,0.00,1,150,'kg',5.00,'2026-01-17 10:31:52','2026-01-17 10:31:52'),(8,'Maggi Noodles','Snacks',14.00,0.00,1,474,'packet',12.00,'2026-01-17 10:31:52','2026-02-12 08:21:04'),(9,'Tata Salt','Essentials',28.00,0.00,1,100,'kg',0.00,'2026-01-17 10:31:52','2026-01-17 10:31:52'),(10,'Gold Winner Oil','Oils',165.00,0.00,1,80,'ltr',5.00,'2026-01-17 10:31:52','2026-01-17 10:31:52'),(11,'Lays Classic Salted','Snacks',20.00,0.00,1,185,'packet',12.00,'2026-01-17 10:31:52','2026-02-11 10:47:32'),(12,'Colgate Strong Teeth','Personal Care',95.00,0.00,1,60,'pcs',18.00,'2026-01-17 10:31:52','2026-01-17 10:31:52');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN'),(2,'CASHIER');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `product_categories` varchar(255) DEFAULT NULL,
  `address` text,
  `gst_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Amul Distributors','Rajesh Kumar','9876543210','Dairy, Ice Cream','Chennai','33AA123','2026-01-17 11:17:52'),(2,'Britannia Agencies','Suresh Babu','9898989898','Bakery, Biscuits','Bangalore','29BB123','2026-01-17 11:17:52'),(3,'Nestle Wholesale','Vikram Singh','9123456780','Chocolates, Maggi','Mumbai','27CC123','2026-01-17 11:17:52'),(4,'Hindustan Unilever','Anita Desai','9988776655','Soaps, Detergents','Delhi','07DD123','2026-01-17 11:17:52'),(5,'ITC Limited','Manoj','8877665544','Atta, Snacks','Kolkata','19EE123','2026-01-17 11:17:52');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$mpaKJup78AR8GpxszhURu.zJZTSLnkCWnww1QvK6X4QKX8d./NIBa',1,'Super Admin','2026-01-17 09:36:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-14 17:40:05
