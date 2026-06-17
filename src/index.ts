import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  require('dotenv').config();
}

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rentify API',
      version: '1.0.0',
      description: 'API Documentation for Rentify Rental Management System',
    },
    servers: [
      {
        url: '/',
        description: 'Current host',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT nhận được sau khi đăng nhập (không cần thêm chữ "Bearer").',
        },
      },
    },
  },
  // Quét theo __dirname để hoạt động cả ở local (src/*.ts qua ts-node)
  // lẫn trên Vercel (dist/*.js sau khi build — comment Swagger được giữ lại).
  // Đổi '\\' -> '/' vì glob coi '\\' là ký tự escape (lỗi trên Windows).
  apis: [path.join(__dirname, 'modules/**/*.routes.{ts,js}').replace(/\\/g, '/')],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Phục vụ spec dưới dạng JSON
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

// Phục vụ Swagger UI bằng HTML tự load asset từ CDN.
// Cách này hoạt động ổn định trên Vercel serverless (không phụ thuộc
// file tĩnh trong node_modules của swagger-ui-express).
app.get('/api-docs', (_req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rentify API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`);
});

app.use(express.static(path.join(__dirname, '../public')));

// App Routes
import authRoutes from './modules/auth/auth.routes';
import roomRoutes from './modules/room/room.routes';
import billRoutes from './modules/bill/bill.routes';
import presetRoutes from './modules/preset/preset.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';
import chatRoutes from './modules/chat/chat.routes';

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', chatRoutes);

// Local dev: start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log(`[swagger]: API Docs available at http://localhost:${port}/api-docs`);
  });
}

// Vercel serverless export
export default app;
