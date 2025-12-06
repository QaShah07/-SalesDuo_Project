-- Database and tables for SalesDuo backend

CREATE DATABASE IF NOT EXISTS salesduo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE salesduo;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asin VARCHAR(32) NOT NULL UNIQUE,
  title_original TEXT NOT NULL,
  bullets_original JSON NOT NULL,
  description_original TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_products_asin (asin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS optimizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  title_optimized TEXT NOT NULL,
  bullets_optimized JSON NOT NULL,
  description_optimized TEXT NOT NULL,
  keywords JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_optimizations_product_id_created_at (product_id, created_at),
  CONSTRAINT fk_optimizations_product FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
