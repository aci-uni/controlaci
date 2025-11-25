# Control de Horas Para Concursos

Sistema de control de horas de trabajo para participantes en concursos.

## Características

### Vista Principal (Login/Registro)
- Autenticación de usuarios
- Registro de nuevos usuarios
- Acceso mediante usuario y contraseña

### Control de Horas
- Contador de horas trabajadas
- Marcado de entrada/salida con fecha y hora
- Captura de foto al marcar entrada (desde el celular)
- Al marcar salida: número de actividades y foto por cada una
- Guardado automático de fecha y hora

### Equipo
- Cantidad de horas acumuladas por usuario del concurso
- Relación de asistencia diaria con horas trabajadas
- Visualización de actividades con fotos
- Soporte para múltiples entradas en un día (ej. salida a almorzar)
- Gráfica de barras con horas acumuladas vs horas totales

### Perfil
- Foto de perfil
- Cantidad de horas individuales por concurso
- Notificaciones (progreso, alertas, etc.)
- Fecha y hora de notificaciones recibidas

### Panel de Administración
- Usuario admin con acceso especial
- Gestión de miembros en concursos
- Modificación de horas totales
- Envío de notificaciones a usuarios

### Porcentaje de Apoyo
- Cálculo de porcentaje basado en horas trabajadas vs totales
- Evaluación de constancia mediante covarianza semanal
- Análisis de consistencia del participante

## Tecnologías

- **Frontend**: React, React Router, Chart.js
- **Backend**: Node.js, Express
- **Base de datos**: MongoDB
- **Autenticación**: JWT
- **Almacenamiento de imágenes**: Multer

## Instalación

### Requisitos previos
- Node.js (v18+)
- MongoDB

### Backend

```bash
cd backend
npm install
# Crear archivo .env basado en .env.example
npm run seed  # Crear usuario admin (usuario: admin, contraseña: admin123)
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Usuario Admin por defecto

- **Usuario**: admin
- **Contraseña**: admin123

## Estructura del Proyecto

```
controlaci/
├── backend/
│   ├── config/          # Configuración de BD
│   ├── middleware/      # Auth y upload
│   ├── models/          # Modelos MongoDB
│   ├── routes/          # API endpoints
│   ├── uploads/         # Fotos subidas
│   └── server.js        # Servidor Express
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Context API (Auth)
│   │   ├── pages/       # Páginas principales
│   │   └── services/    # API services
│   └── public/
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil

### Concursos
- `GET /api/contests` - Listar concursos activos
- `GET /api/contests/my` - Mis concursos
- `POST /api/contests` - Crear concurso (admin)
- `PUT /api/contests/:id` - Actualizar concurso (admin)
- `POST /api/contests/:id/members` - Agregar miembro (admin)

### Registros de Tiempo
- `POST /api/timeentries/entry` - Marcar entrada
- `PUT /api/timeentries/exit/:id` - Marcar salida
- `GET /api/timeentries/stats/:contestId` - Estadísticas

### Notificaciones
- `GET /api/notifications/my` - Mis notificaciones
- `POST /api/notifications` - Enviar notificación (admin)
- `PUT /api/notifications/:id/read` - Marcar como leída

