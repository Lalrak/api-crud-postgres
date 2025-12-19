import pool from "../config/db.js";

const createUserTable = async () => {
  const queryText = `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
)`;

  try {
    await pool.query(queryText);
    console.log("Table users created if not exists");
  } catch (error) {
    console.log("Error creating user table: ", error);
  }
};

export default createUserTable;
