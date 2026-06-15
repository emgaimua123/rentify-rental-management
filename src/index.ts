import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
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
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.static(path.join(__dirname, '../public')));

// App Routes
import authRoutes from './modules/auth/auth.routes';
import roomRoutes from './modules/room/room.routes';
import billRoutes from './modules/bill/bill.routes';
import presetRoutes from './modules/preset/preset.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api', subscriptionRoutes);

// Local dev: start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log(`[swagger]: API Docs available at http://localhost:${port}/api-docs`);
  });
}

// Vercel serverless export
export default app;
