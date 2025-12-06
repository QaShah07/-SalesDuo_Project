/**
 * Placeholder for MySQL connection.
 * 
 * When you implement persistence, you can use mysql2 or an ORM here.
 * For now this file only documents the shape of the connection.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});