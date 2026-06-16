"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
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
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts'],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// App Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const room_routes_1 = __importDefault(require("./modules/room/room.routes"));
const bill_routes_1 = __importDefault(require("./modules/bill/bill.routes"));
const preset_routes_1 = __importDefault(require("./modules/preset/preset.routes"));
const subscription_routes_1 = __importDefault(require("./modules/subscription/subscription.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.use('/api/bills', bill_routes_1.default);
app.use('/api/presets', preset_routes_1.default);
app.use('/api', subscription_routes_1.default);
// Local dev: start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
        console.log(`[swagger]: API Docs available at http://localhost:${port}/api-docs`);
    });
}
// Vercel serverless export
exports.default = app;
