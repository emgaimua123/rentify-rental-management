import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import roomRoutes from './routes/room.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
// Phục vụ file tĩnh cho thư mục uploads
app.use('/uploads', express.static('public/uploads'));

// Swagger Options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Rentify API Documentation',
      version: '1.0.0',
      description: 'API tài liệu cho hệ thống quản lý phòng trọ Rentify'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/rooms', roomRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Welcome to Rentify API! Access /api-docs for Swagger UI.');
});

// Bắt đầu server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Swagger UI có sẵn tại http://localhost:${PORT}/api-docs`);
});
