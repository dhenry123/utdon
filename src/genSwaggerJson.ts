/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { writeFileSync } from "fs";

import { APPLICATION_VERSION, OPENAPIFILEJSON } from "./Constants";

// Swagger Documentation
import swaggerJsdoc from "swagger-jsdoc";

//Swagger
const swaggerDefinition = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Utdon API Documentation",
      version: APPLICATION_VERSION,
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    servers: [{ url: "/api/v1" }],
  },
  apis: ["./src/routes/*"],
};
const swaggerSpec = swaggerJsdoc(swaggerDefinition);
writeFileSync(OPENAPIFILEJSON, JSON.stringify(swaggerSpec), "utf-8");
console.log("Swagger JSON file has been flushed", OPENAPIFILEJSON);
process.exit(0);
