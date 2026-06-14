import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Rentify API');
});

// App Routes
import roomRoutes from './modules/room/room.routes';
app.use('/api/rooms', roomRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`[swagger]: API Docs available at http://localhost:${port}/api-docs`);
});
