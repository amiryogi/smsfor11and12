-- =====================================================
-- NEB +2 School ERP Database Schema
-- Engine: MySQL 8+
-- Charset: utf8mb4
-- Multi-tenant ready
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. SCHOOLS
-- =====================================================

CREATE TABLE schools (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    contact_email VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 2. USERS
-- =====================================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,

    role ENUM('ADMIN','EXAM_HEAD','ACCOUNTANT','TEACHER','PARENT','STUDENT') NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_users_school FOREIGN KEY (school_id)
        REFERENCES schools(id)
        ON DELETE RESTRICT,

    UNIQUE KEY unique_email_per_school (email, school_id),
    INDEX idx_users_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 3. REFRESH TOKENS (Token Rotation)
-- =====================================================

CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 4. ACADEMIC STRUCTURE
-- =====================================================

CREATE TABLE academic_years (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_year_school FOREIGN KEY (school_id)
        REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE streams (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_stream_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    UNIQUE KEY unique_stream_school (name, school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subjects (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    stream_id CHAR(36) NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    full_marks INT NOT NULL,
    pass_marks INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_subject_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_subject_stream FOREIGN KEY (stream_id)
        REFERENCES streams(id),

    UNIQUE KEY unique_subject_code (code, school_id),
    INDEX idx_subject_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 5. PARENTS & TEACHERS
-- =====================================================

CREATE TABLE parents (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_parent_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE teachers (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL UNIQUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 6. STUDENTS (UPDATED WITH AD + BS DOB + REG NO)
-- =====================================================

CREATE TABLE students (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL UNIQUE,

    roll_number VARCHAR(50) NOT NULL,
    registration_no VARCHAR(50) NOT NULL,

    date_of_birth_ad DATE NOT NULL,
    date_of_birth_bs_year SMALLINT NOT NULL,
    date_of_birth_bs_month TINYINT NOT NULL,
    date_of_birth_bs_day TINYINT NOT NULL,

    gender ENUM('MALE','FEMALE','OTHER') NOT NULL,
    citizenship_no VARCHAR(50),
    student_photo_url VARCHAR(255),

    class INT NOT NULL,
    stream_id CHAR(36) NOT NULL,
    parent_id CHAR(36),

    status ENUM('ACTIVE','TRANSFERRED','GRADUATED','DROPPED') DEFAULT 'ACTIVE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_student_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_student_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_stream FOREIGN KEY (stream_id)
        REFERENCES streams(id),

    CONSTRAINT fk_student_parent FOREIGN KEY (parent_id)
        REFERENCES parents(id)
        ON DELETE SET NULL,

    UNIQUE KEY unique_roll_per_school (roll_number, school_id),
    UNIQUE KEY unique_registration_per_school (registration_no, school_id),
    INDEX idx_student_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 7. BOARD EXAM REGISTRATION (Symbol No Here)
-- =====================================================

CREATE TABLE board_exam_registrations (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    academic_year_id CHAR(36) NOT NULL,

    symbol_no VARCHAR(50) NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_board_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_board_student FOREIGN KEY (student_id)
        REFERENCES students(id),

    CONSTRAINT fk_board_year FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id),

    UNIQUE KEY unique_symbol_per_school (symbol_no, school_id),
    INDEX idx_board_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 8. EXAMS & MARKS
-- =====================================================

CREATE TABLE exams (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    academic_year_id CHAR(36) NOT NULL,

    name VARCHAR(100) NOT NULL,
    class INT NOT NULL,
    term_type ENUM('FIRST_TERM','MID_TERM','PRE_BOARD','FINAL') NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_exam_year FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE marks (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,
    exam_id CHAR(36) NOT NULL,
    subject_id CHAR(36) NOT NULL,

    theory_marks DECIMAL(5,2),
    practical_marks DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    grade VARCHAR(5),
    grade_point DECIMAL(3,2),

    is_locked BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mark_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_mark_student FOREIGN KEY (student_id)
        REFERENCES students(id),

    CONSTRAINT fk_mark_exam FOREIGN KEY (exam_id)
        REFERENCES exams(id),

    CONSTRAINT fk_mark_subject FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    UNIQUE KEY unique_mark (student_id, exam_id, subject_id),
    INDEX idx_mark_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 9. FINANCE (ACID SAFE)
-- =====================================================

CREATE TABLE fee_structures (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,

    class INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_fee_school FOREIGN KEY (school_id)
        REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    student_id CHAR(36) NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('CASH','BANK_TRANSFER','ESEWA','KHALTI','CHEQUE') NOT NULL,
    transaction_ref VARCHAR(100),
    remarks TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_school FOREIGN KEY (school_id)
        REFERENCES schools(id),

    CONSTRAINT fk_payment_student FOREIGN KEY (student_id)
        REFERENCES students(id),

    INDEX idx_payment_school (school_id),
    INDEX idx_payment_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 10. AUDIT LOG
-- =====================================================

CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY,
    school_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,

    action VARCHAR(150) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id CHAR(36) NOT NULL,
    metadata JSON,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;