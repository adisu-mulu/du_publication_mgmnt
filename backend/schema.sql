-- Dilla University Publication Management System Schema
CREATE DATABASE IF NOT EXISTS du_publication_db;
USE du_publication_db;

-- 1. Colleges
CREATE TABLE IF NOT EXISTS colleges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_accounts_email (email)
) ENGINE=InnoDB;

-- 3. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- 4. Account Roles (Composite PK, nothing else)
CREATE TABLE IF NOT EXISTS account_roles (
    account_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (account_id, role_id),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    college_id INT NOT NULL,
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    INDEX idx_users_college (college_id)
) ENGINE=InnoDB;

-- 6. Publications (Clean agreed-upon university fields, no defaults)
CREATE TABLE IF NOT EXISTS publications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    author_phone VARCHAR(50),
    author_email VARCHAR(255),
    theme VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date_published DATE NOT NULL,
    journal_name VARCHAR(255),
    doi VARCHAR(255),
    indexing VARCHAR(100),
    quartile ENUM('Q1', 'Q2', 'Q3', 'Q4'),
    funder ENUM('Dilla University', 'Other') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL,
    remark TEXT,
    submitted_by INT NOT NULL,
    college_id INT NOT NULL,
    reviewed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_pubs_submitted_by (submitted_by),
    INDEX idx_pubs_college_status (college_id, status),
    INDEX idx_pubs_status (status),
    INDEX idx_pubs_type (type),
    INDEX idx_pubs_date (date_published)
) ENGINE=InnoDB;
