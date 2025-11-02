// src/services/user.service.ts
import { db, eq, and } from "../../../../packages/db/src";
import {
  users,
  type NewUser,
  type User,
} from "../../../../packages/db/src/schema/auth";

export class UserService {
  /**
   * Find or create a user from OAuth profile
   */
  static async findOrCreateFromOAuth(profile: {
    email: string;
    name?: string;
    image?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    try {
      // Try to find existing user by provider and providerId
      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.provider, profile.provider),
            eq(users.providerId, profile.providerId)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        console.log(
          "[UserService] Found existing user:",
          existingUser[0].email
        );

        // Update user info in case it changed
        const [updatedUser] = await db
          .update(users)
          .set({
            name: profile.name,
            image: profile.image,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id))
          .returning();

        return updatedUser;
      }

      // Create new user
      console.log("[UserService] Creating new user:", profile.email);
      const [newUser] = await db
        .insert(users)
        .values({
          email: profile.email,
          name: profile.name,
          image: profile.image,
          provider: profile.provider,
          providerId: profile.providerId,
        })
        .returning();

      console.log("[UserService] User created successfully:", newUser.id);
      return newUser;
    } catch (error) {
      console.error("[UserService] Error in findOrCreateFromOAuth:", error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  /**
   * Update user
   */
  static async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
