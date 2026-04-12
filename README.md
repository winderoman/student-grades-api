# 🎓 Sistema de Notas Estudiantiles — REST API

Backend REST API construido con **Node.js + Express + TypeScript + Sequelize (MySQL)**.

---

## 🚀 Stack Tecnológico

| Capa      | Tecnología             |
|-----------|------------------------|
| Runtime   | Node.js + TypeScript   |
| Framework | Express.js             |
| ORM       | Sequelize v6 (MySQL2)  |
| Auth      | JWT                    |
| Validación| Joi (separado de rutas)|
| Email     | Nodemailer / Gmail SMTP|
| Storage   | Google Drive API v3    |
| Export    | ExcelJS + PDFKit       |
| Logs      | Winston                |
| Seguridad | CORS, Rate Limiting    |

---

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── database.ts       # Conexión Sequelize
│   └── seed.ts           # Datos de prueba
├── controllers/v1/       # Lógica de respuesta HTTP
│   ├── auth.controller.ts
│   ├── student.controller.ts
│   ├── subject.controller.ts
│   ├── grade.controller.ts
│   └── report.controller.ts
├── middlewares/
│   ├── auth.middleware.ts       # JWT + roles
│   ├── validate.middleware.ts   # Factory de validadores Joi
│   ├── error.middleware.ts      # Manejador global de errores
│   └── rateLimiter.middleware.ts
├── models/               # Modelos Sequelize (MySQL)
│   ├── User.ts
│   ├── Student.ts
│   ├── Subject.ts
│   ├── Grade.ts
│   └── index.ts
├── routes/v1/            # Rutas limpias (solo middleware + controller)
│   ├── auth.routes.ts
│   ├── student.routes.ts
│   ├── subject.routes.ts
│   ├── grade.routes.ts
│   ├── report.routes.ts
│   └── index.ts
├── services/             # Lógica de negocio
│   ├── auth.service.ts
│   ├── student.service.ts
│   ├── subject.service.ts
│   ├── grade.service.ts
│   ├── email.service.ts
│   ├── drive.service.ts
│   └── export.service.ts
├── types/index.ts        # Interfaces y enums globales
├── utils/
│   ├── logger.ts
│   ├── response.ts       # Helpers de respuesta HTTP
│   └── pagination.ts
├── app.ts                # Express app
└── index.ts              # Entry point
```

---

## ⚙️ Instalación

```bash
git clone <repo>
cd student-grades-api
npm install
cp .env.example .env   # Configurar variables
```

### Variables de entorno requeridas

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=student_grades_db
DB_USER=root
DB_PASSWORD=yourpassword

JWT_SECRET=your_secret
JWT_EXPIRES_IN=8h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASSWORD=app_password

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...
```

### Comandos

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Producción

# Poblar base de datos con datos de prueba
npm run seed
```

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <access_token>
```

### Roles

| Rol | Permisos |
|-----|----------|
| `admin` | CRUD completo, reportes globales, boletines masivos |
| `teacher` | Registrar/editar notas, ver estudiantes y materias |
| `student` | Ver sus propias notas y boletines |

---

## 📡 Endpoints

### Auth `/api/v1/auth`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/register` | Público | Registrar usuario |
| POST | `/login` | Público | Login → tokens |
| POST | `/refresh` | Público | Renovar access token |
| GET | `/me` | 🔐 Todos | Perfil actual |
| PATCH | `/change-password` | 🔐 Todos | Cambiar contraseña |

---

### Estudiantes `/api/v1/students`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/` | Admin | Crear estudiante |
| GET | `/` | Admin, Teacher | Listar (paginado, búsqueda) |
| GET | `/me` | Student | Mi perfil |
| GET | `/:id` | Admin, Teacher | Detalle por ID |
| PUT | `/:id` | Admin | Actualizar |
| DELETE | `/:id` | Admin | Desactivar |
| GET | `/:id/averages` | Todos | Promedios por materia |

**Query params:** `?page=1&limit=10&search=codigo`

---

### Materias `/api/v1/subjects`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/` | Admin | Crear materia |
| GET | `/` | Todos | Listar |
| GET | `/:id` | Todos | Detalle |
| PUT | `/:id` | Admin | Actualizar |
| DELETE | `/:id` | Admin | Desactivar |
| GET | `/:id/stats` | Admin, Teacher | Estadísticas (promedio, aprobados) |

---

### Notas `/api/v1/grades`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/` | Teacher, Admin | Registrar nota individual |
| POST | `/bulk` | Teacher, Admin | Registro masivo |
| GET | `/` | Admin, Teacher | Listar con filtros |
| GET | `/:id` | Todos | Detalle |
| PUT | `/:id` | Teacher, Admin | Actualizar |
| DELETE | `/:id` | Admin | Eliminar |
| GET | `/report/student/:studentId` | Todos | Reporte por estudiante |
| GET | `/report/global` | Admin | Reporte global |

**Filtros:** `?studentId=1&subjectId=2&period=2024-1&page=1&limit=10`

**Tipos de nota:** `parcial | final | tarea | proyecto | examen`

---

### Reportes y Exportación `/api/v1/reports`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/my` | Student | Mi reporte personal |
| GET | `/student/:id/excel` | Admin, Teacher | Exportar notas en Excel |
| GET | `/student/:id/pdf` | Admin, Teacher, Student | Boletín en PDF |
| GET | `/global/excel` | Admin | Reporte global Excel |
| POST | `/student/:id/send-bulletin` | Admin, Teacher | Enviar boletín por email |
| POST | `/send-bulk-bulletins` | Admin | Enviar boletines masivos |
| POST | `/student/:id/drive` | Admin | Subir PDF a Google Drive |
| GET | `/drive/list` | Admin | Listar reportes en Drive |

---

## 📦 Ejemplos de Request

### Login
```json
POST /api/v1/auth/login
{
  "email": "admin@school.edu",
  "password": "Admin123!"
}
```

### Registrar nota
```json
POST /api/v1/grades
Authorization: Bearer <token>
{
  "studentId": 1,
  "subjectId": 1,
  "score": 87.5,
  "period": "2024-1",
  "gradeType": "parcial",
  "comments": "Buen desempeño"
}
```

### Registro masivo de notas
```json
POST /api/v1/grades/bulk
{
  "subjectId": 1,
  "period": "2024-1",
  "gradeType": "final",
  "grades": [
    { "studentId": 1, "score": 90 },
    { "studentId": 2, "score": 75 },
    { "studentId": 3, "score": 55, "comments": "Recuperación pendiente" }
  ]
}
```

### Enviar boletín
```json
POST /api/v1/reports/student/1/send-bulletin
{
  "period": "2024-1"
}
```

---

## 🛡️ Validaciones

- Notas: rango estricto **0 – 100**
- Emails únicos por usuario
- Códigos de estudiante únicos
- Roles validados en cada endpoint
- Rate limiting: 100 req/15min global, 10 req/15min en login
- Contraseñas hasheadas con **bcrypt (cost 12)**

---

## 📊 Respuesta estándar

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

Errores:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["La nota no puede ser mayor a 100"]
}
```
