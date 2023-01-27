import { server, baseProcedure } from "../index";
import { z } from "zod";
import { db } from "../prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const userRouter = server.sub("/user");

function getRandomString(hashCharLength: number) {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(hashCharLength, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer.toString("base64"));
    });
  });
}

function hashPlaintext(plaintext: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(plaintext.normalize(), salt.normalize(), 100, 512, "sha512", (err, buffer) => {
      if (err) reject(err);
      resolve(buffer.toString("base64"));
    });
  });
}

const AUTH_TOKEN_NAME = "skludge_token";
const JWT_SECRET = process.env.JWT_SECRET ?? getRandomString(128);

userRouter.post(
  "/register",
  baseProcedure.input(z.object({ username: z.string(), password: z.string() }))
)(async function (req, res) {
  const salt = await getRandomString(128);
  const hash = await hashPlaintext(res.locals.input.password, salt);

  const newUser = await db.user.create({
    data: {
      username: res.locals.input.username,
      salt: salt,
      hash: hash,
    },
  });

  return {
    username: newUser.username,
    createdAt: newUser.createdAt.valueOf(),
    updatedAt: newUser.updatedAt.valueOf(),
  };
});

userRouter.post(
  "/login",
  baseProcedure.input(z.object({ username: z.string(), password: z.string() }))
)(async function (req, res) {
  const user = await db.user.findFirst({ where: { username: res.locals.input.username } });
  if (user == null) return false;
  if (user.hash != (await hashPlaintext(res.locals.input.password, user.salt))) return false;

  const cookiePayload = jwt.sign({ uuid: user.uuid }, await JWT_SECRET, { expiresIn: "1d" });
  res.cookie(AUTH_TOKEN_NAME, cookiePayload, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV?.startsWith("prod") != false,
  });

  return true;
});
