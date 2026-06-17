"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const path_1 = __importDefault(require("path"));
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    require('dotenv').config();
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
app.use('/assets', express_1.default.static(path_1.default.join(__dirname, '../assets')));
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
    apis: [path_1.default.join(__dirname, 'modules/**/*.routes.{ts,js}').replace(/\\/g, '/')],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Phục vụ spec dưới dạng JSON
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
});
// Phục vụ Swagger UI bằng HTML tự load asset từ CDN.
// Cách này hoạt động ổn định trên Vercel serverless (không phụ thuộc
// file tĩnh trong node_modules của swagger-ui-express).
app.get('/api-docs', (_req, res) => {
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
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// App Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const room_routes_1 = __importDefault(require("./modules/room/room.routes"));
const bill_routes_1 = __importDefault(require("./modules/bill/bill.routes"));
const preset_routes_1 = __importDefault(require("./modules/preset/preset.routes"));
const subscription_routes_1 = __importDefault(require("./modules/subscription/subscription.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.use('/api/bills', bill_routes_1.default);
app.use('/api/presets', preset_routes_1.default);
app.use('/api', subscription_routes_1.default);
app.use('/api', chat_routes_1.default);
// Local dev: start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
        console.log(`[swagger]: API Docs available at http://localhost:${port}/api-docs`);
    });
}
// Vercel serverless export
exports.default = app;
