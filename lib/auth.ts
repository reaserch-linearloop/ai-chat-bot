import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase } from "./mongodb"
import type { User, AuthUser } from "./models"

const JWT_SECRET = process.env.JWT_SECRET!

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    }
  } catch (error) {
    return null
  }
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const db = await getDatabase()
  const users = db.collection<User>("users")

  // Check if user already exists
  const existingUser = await users.findOne({ email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const user: User = {
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await users.insertOne(user)
  return { ...user, _id: result.insertedId }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const db = await getDatabase()
  const users = db.collection<User>("users")

  const user = await users.findOne({ email })
  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  return {
    id: user._id!.toString(),
    email: user.email,
    name: user.name,
  }
}
