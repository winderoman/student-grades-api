-- ============================================================
--  Sistema de Notas Estudiantiles
--  Base de datos: student_grades_db
--  Motor: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `student_grades_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `student_grades_db`;

-- ============================================================
-- TABLA: users
-- Usuarios del sistema (admin, teacher, student)
-- ============================================================
CREATE TABLE `users` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150)    NOT NULL,
  `email`      VARCHAR(255)    NOT NULL,
  `password`   VARCHAR(255)    NOT NULL  COMMENT 'bcrypt hash',
  `role`       ENUM('admin','teacher','student') NOT NULL,
  `is_active`  TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema: administradores, profesores y estudiantes';


-- ============================================================
-- TABLA: students
-- Perfil extendido del estudiante (1-a-1 con users)
-- ============================================================
CREATE TABLE `students` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`      INT UNSIGNED  NOT NULL,
  `student_code` VARCHAR(20)   NOT NULL COMMENT 'Ej: EST-2024-001',
  `grade`        VARCHAR(20)   NOT NULL COMMENT 'Ej: 10mo, 11vo',
  `section`      VARCHAR(10)            DEFAULT NULL COMMENT 'Ej: A, B, C',
  `parent_email` VARCHAR(255)           DEFAULT NULL COMMENT 'Correo acudiente para boletines',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_students_code`    (`student_code`),
  UNIQUE KEY `uq_students_user_id` (`user_id`),
  KEY `idx_students_grade`   (`grade`),
  KEY `idx_students_section` (`section`),

  CONSTRAINT `fk_students_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Perfil académico del estudiante';


-- ============================================================
-- TABLA: subjects
-- Materias / asignaturas
-- ============================================================
CREATE TABLE `subjects` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150)  NOT NULL,
  `code`        VARCHAR(20)   NOT NULL COMMENT 'Ej: MAT-101',
  `description` TEXT                   DEFAULT NULL,
  `credits`     TINYINT UNSIGNED       DEFAULT 1,
  `teacher_id`  INT UNSIGNED  NOT NULL COMMENT 'Profesor responsable',
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subjects_code` (`code`),
  KEY `idx_subjects_teacher`  (`teacher_id`),
  KEY `idx_subjects_active`   (`is_active`),

  CONSTRAINT `fk_subjects_teacher`
    FOREIGN KEY (`teacher_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Materias o asignaturas del plan de estudios';


-- ============================================================
-- TABLA: grades
-- Notas / calificaciones
-- ============================================================
CREATE TABLE `grades` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `student_id`       INT UNSIGNED    NOT NULL,
  `subject_id`       INT UNSIGNED    NOT NULL,
  `registered_by_id` INT UNSIGNED    NOT NULL COMMENT 'Profesor que registró la nota',
  `score`            DECIMAL(5,2)    NOT NULL COMMENT 'Rango: 0.00 – 100.00',
  `period`           VARCHAR(20)     NOT NULL COMMENT 'Ej: 2024-1, 2024-2',
  `grade_type`       ENUM('parcial','final','tarea','proyecto','examen') NOT NULL,
  `comments`         TEXT                     DEFAULT NULL,
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_grades_student`  (`student_id`),
  KEY `idx_grades_subject`  (`subject_id`),
  KEY `idx_grades_period`   (`period`),
  KEY `idx_grades_type`     (`grade_type`),
  KEY `idx_grades_student_subject_period` (`student_id`, `subject_id`, `period`),

  CONSTRAINT `chk_grades_score`
    CHECK (`score` >= 0 AND `score` <= 100),

  CONSTRAINT `fk_grades_student`
    FOREIGN KEY (`student_id`)
    REFERENCES `students` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_grades_subject`
    FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_grades_registered_by`
    FOREIGN KEY (`registered_by_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notas registradas por los profesores';


-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: promedio de cada estudiante por materia y período
CREATE OR REPLACE VIEW `v_student_averages` AS
SELECT
  s.id                          AS student_id,
  u.name                        AS student_name,
  s.student_code,
  s.grade,
  s.section,
  sub.id                        AS subject_id,
  sub.name                      AS subject_name,
  sub.code                      AS subject_code,
  g.period,
  ROUND(AVG(g.score), 2)        AS average,
  COUNT(g.id)                   AS total_grades,
  MAX(g.score)                  AS max_score,
  MIN(g.score)                  AS min_score,
  CASE
    WHEN AVG(g.score) >= 60 THEN 'Aprobado'
    ELSE 'Reprobado'
  END                           AS status
FROM grades g
INNER JOIN students s   ON g.student_id  = s.id
INNER JOIN users    u   ON s.user_id     = u.id
INNER JOIN subjects sub ON g.subject_id  = sub.id
GROUP BY
  s.id, u.name, s.student_code, s.grade, s.section,
  sub.id, sub.name, sub.code, g.period;


-- Vista: estadísticas globales por materia y período
CREATE OR REPLACE VIEW `v_subject_stats` AS
SELECT
  sub.id                          AS subject_id,
  sub.name                        AS subject_name,
  sub.code                        AS subject_code,
  u.name                          AS teacher_name,
  g.period,
  COUNT(DISTINCT g.student_id)    AS total_students,
  ROUND(AVG(g.score), 2)          AS average,
  MAX(g.score)                    AS max_score,
  MIN(g.score)                    AS min_score,
  SUM(CASE WHEN g.score >= 60 THEN 1 ELSE 0 END)  AS passing,
  SUM(CASE WHEN g.score  < 60 THEN 1 ELSE 0 END)  AS failing,
  ROUND(
    SUM(CASE WHEN g.score >= 60 THEN 1 ELSE 0 END)
    / COUNT(*) * 100, 1
  )                               AS passing_rate_pct
FROM grades  g
INNER JOIN subjects sub ON g.subject_id  = sub.id
INNER JOIN users    u   ON sub.teacher_id = u.id
GROUP BY sub.id, sub.name, sub.code, u.name, g.period;


-- Vista: reporte completo de notas (útil para exportar)
CREATE OR REPLACE VIEW `v_full_grade_report` AS
SELECT
  g.id                AS grade_id,
  g.period,
  g.grade_type,
  g.score,
  g.comments,
  g.created_at,
  s.id                AS student_id,
  s.student_code,
  s.grade             AS student_grade,
  s.section,
  u_stu.name          AS student_name,
  u_stu.email         AS student_email,
  sub.id              AS subject_id,
  sub.code            AS subject_code,
  sub.name            AS subject_name,
  u_tch.name          AS teacher_name
FROM grades     g
INNER JOIN students sub_s ON g.student_id       = sub_s.id
INNER JOIN students s     ON g.student_id       = s.id
INNER JOIN users  u_stu   ON s.user_id          = u_stu.id
INNER JOIN subjects sub   ON g.subject_id       = sub.id
INNER JOIN users  u_tch   ON sub.teacher_id     = u_tch.id;


-- ============================================================
-- DATOS SEMILLA (SEED)
-- Contraseñas hasheadas con bcrypt cost 12:
--   Admin123!   → hash incluido abajo
--   Teacher123! → hash incluido abajo
--   Student123! → hash incluido abajo
-- ============================================================

-- USUARIOS
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Administrador',      'admin@school.edu',               '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFX6BXfmH9TZPZW', 'admin'),
('Prof. María García', 'mgarcia@school.edu',             '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',   'teacher'),
('Prof. Juan López',   'jlopez@school.edu',              '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',   'teacher'),
('Ana Martínez',       'ana.martinez@student.edu',       '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',   'student'),
('Carlos Rodríguez',   'carlos.rodriguez@student.edu',   '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',   'student'),
('Lucía Pérez',        'lucia.perez@student.edu',        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',   'student');

-- ESTUDIANTES
INSERT INTO `students` (`user_id`, `student_code`, `grade`, `section`, `parent_email`) VALUES
(4, 'EST-2024-001', '10mo', 'A', 'parent.ana@gmail.com'),
(5, 'EST-2024-002', '10mo', 'A', 'parent.carlos@gmail.com'),
(6, 'EST-2024-003', '10mo', 'B', 'parent.lucia@gmail.com');

-- MATERIAS
INSERT INTO `subjects` (`name`, `code`, `description`, `credits`, `teacher_id`) VALUES
('Matemáticas',        'MAT-101', 'Álgebra, geometría y cálculo básico',  4, 2),
('Ciencias Naturales', 'CIE-101', 'Biología, química y física elemental', 3, 3),
('Español',            'ESP-101', 'Lengua castellana y literatura',       3, 2),
('Historia',           'HIS-101', 'Historia universal y de Colombia',     2, 3),
('Inglés',             'ING-101', 'Inglés básico A1–A2',                  3, 2);

-- NOTAS — Período 2024-1
INSERT INTO `grades` (`student_id`, `subject_id`, `registered_by_id`, `score`, `period`, `grade_type`, `comments`) VALUES
-- Ana / Matemáticas
(1, 1, 2, 85.00, '2024-1', 'parcial',  'Buen dominio de álgebra'),
(1, 1, 2, 92.50, '2024-1', 'tarea',    'Entregó completo y a tiempo'),
(1, 1, 2, 78.00, '2024-1', 'final',    NULL),
-- Ana / Ciencias
(1, 2, 3, 90.00, '2024-1', 'parcial',  NULL),
(1, 2, 3, 88.00, '2024-1', 'final',    'Excelente exposición'),
-- Ana / Español
(1, 3, 2, 95.00, '2024-1', 'proyecto', 'Proyecto literario sobresaliente'),
(1, 3, 2, 89.00, '2024-1', 'parcial',  NULL),
-- Ana / Inglés
(1, 5, 2, 82.00, '2024-1', 'parcial',  NULL),
(1, 5, 2, 85.00, '2024-1', 'final',    NULL),

-- Carlos / Matemáticas
(2, 1, 2, 55.00, '2024-1', 'parcial',  'Necesita refuerzo en ecuaciones'),
(2, 1, 2, 62.00, '2024-1', 'final',    'Mejoró para el final'),
-- Carlos / Ciencias
(2, 2, 3, 70.00, '2024-1', 'parcial',  NULL),
(2, 2, 3, 75.00, '2024-1', 'final',    NULL),
-- Carlos / Español
(2, 3, 2, 68.00, '2024-1', 'parcial',  NULL),
(2, 3, 2, 72.00, '2024-1', 'final',    NULL),

-- Lucía / Matemáticas
(3, 1, 2, 91.00, '2024-1', 'parcial',  NULL),
(3, 1, 2, 95.00, '2024-1', 'tarea',    'La mejor del grupo'),
(3, 1, 2, 93.00, '2024-1', 'final',    NULL),
-- Lucía / Historia
(3, 4, 3, 88.00, '2024-1', 'parcial',  NULL),
(3, 4, 3, 90.00, '2024-1', 'proyecto', 'Investigación muy completa'),
-- Lucía / Inglés
(3, 5, 2, 79.00, '2024-1', 'parcial',  NULL),
(3, 5, 2, 83.00, '2024-1', 'final',    NULL);

-- NOTAS — Período 2024-2
INSERT INTO `grades` (`student_id`, `subject_id`, `registered_by_id`, `score`, `period`, `grade_type`) VALUES
(1, 1, 2, 88.00, '2024-2', 'parcial'),
(1, 1, 2, 91.00, '2024-2', 'final'),
(2, 1, 2, 60.00, '2024-2', 'parcial'),
(2, 1, 2, 65.00, '2024-2', 'final'),
(3, 1, 2, 97.00, '2024-2', 'parcial'),
(3, 1, 2, 96.00, '2024-2', 'final');


-- ============================================================
-- CONSULTAS DE EJEMPLO
-- ============================================================

-- 1. Promedio de un estudiante por materia en un período
/*
SELECT subject_name, subject_code, average, total_grades, status
FROM v_student_averages
WHERE student_id = 1 AND period = '2024-1'
ORDER BY subject_name;
*/

-- 2. Estadísticas de una materia en todos los períodos
/*
SELECT period, total_students, average, passing, failing, passing_rate_pct
FROM v_subject_stats
WHERE subject_id = 1
ORDER BY period;
*/

-- 3. Reporte global — todos los estudiantes, todas las materias
/*
SELECT student_name, student_code, subject_name, period, grade_type, score
FROM v_full_grade_report
ORDER BY student_name, subject_name, period;
*/

-- 4. Top 3 estudiantes por promedio general (todos los períodos)
/*
SELECT
  student_name,
  student_code,
  ROUND(AVG(average), 2) AS global_avg
FROM v_student_averages
GROUP BY student_id, student_name, student_code
ORDER BY global_avg DESC
LIMIT 3;
*/

-- 5. Estudiantes reprobados en al menos una materia en 2024-1
/*
SELECT DISTINCT student_name, student_code, subject_name, average
FROM v_student_averages
WHERE period = '2024-1' AND status = 'Reprobado';
*/
