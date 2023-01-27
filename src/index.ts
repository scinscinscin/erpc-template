import { Server, generateProcedure } from "@scinorandex/erpc";

export const baseProcedure = generateProcedure(async (req, res) => {
  return {};
});

export const server = new Server({
  port: 10000,
  startAuto: true,
  defaultMiddleware: {
    corsOptions: {
      credentials: true,
      origin: "http://localhost:5173",
    },
  },
});

import "./routers/userRouter";
