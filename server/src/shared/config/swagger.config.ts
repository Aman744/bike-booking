import swaggerJSDoc from 'swagger-jsdoc';
import env from './env.config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bike Booking QR System API',
      version: '1.0.0',
      description: 'Enterprise MERN stack booking management platform API documentation',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT authorization token stored in cookies',
        },
      },
    },
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.ts',
    './src/routes/**/*.ts',
    './dist/modules/**/*.routes.js',
    './dist/modules/**/*.js'
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
