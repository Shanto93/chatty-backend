// import redisClient from "./client";

// const ONLINE_USERS_KEY = "online:users";
// const ROOM_ONLINE_PREFIX = "room:online:";
// const ROOM_CACHE_PREFIX = "room:cache:";
// const USER_ROOMS_PREFIX = "user:rooms:";
// const MESSAGE_CACHE_TTL = 86400;

// export class PresenceService {
//   /*** Set user as online*/
//   async setUserOnline(userId: string): Promise<void> {
//     try {
//       await redisClient.sAdd(ONLINE_USERS_KEY, userId);
//       await redisClient.setEx(`user:${userId}:status`, 3600, "online");
//       console.log(`User ${userId} marked as online`);
//     } catch (error) {
//       console.error("Error setting user online:", error);
//     }
//   }

//   /*** Set user as offline*/
//   async setUserOffline(userId: string): Promise<void> {
//     try {
//       await redisClient.sRem(ONLINE_USERS_KEY, userId);
//       await redisClient.setEx(`user:${userId}:status`, 3600, "offline");
//       console.log(`User ${userId} marked as offline`);
//     } catch (error) {
//       console.error("Error setting user offline:", error);
//     }
//   }

//   /*** Check if user is online*/
//   async isUserOnline(userId: string): Promise<boolean> {
//     try {
//       return await redisClient.sIsMember(ONLINE_USERS_KEY, userId);
//     } catch (error) {
//       console.error("Error checking user online status:", error);
//       return false;
//     }
//   }

//   /*** Get all online users*/
//   async getOnlineUsers(): Promise<string[]> {
//     try {
//       return await redisClient.sMembers(ONLINE_USERS_KEY);
//     } catch (error) {
//       console.error("Error getting online users:", error);
//       return [];
//     }
//   }

//   /*** Add user to room*/
//   async addUserToRoom(roomId: string, userId: string): Promise<void> {
//     try {
//       const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
//       await redisClient.sAdd(roomKey, userId);
//       await redisClient.sAdd(`${USER_ROOMS_PREFIX}${userId}`, roomId);
//       console.log(`User ${userId} added to room ${roomId}`);
//     } catch (error) {
//       console.error("Error adding user to room:", error);
//     }
//   }

//   /*** Remove user from room*/
//   async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
//     try {
//       const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
//       await redisClient.sRem(roomKey, userId);
//       await redisClient.sRem(`${USER_ROOMS_PREFIX}${userId}`, roomId);
//       console.log(`User ${userId} removed from room ${roomId}`);
//     } catch (error) {
//       console.error("Error removing user from room:", error);
//     }
//   }

//   /*** Get online users in a room*/
//   async getRoomOnlineUsers(roomId: string): Promise<string[]> {
//     try {
//       const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
//       return await redisClient.sMembers(roomKey);
//     } catch (error) {
//       console.error("Error getting room online users:", error);
//       return [];
//     }
//   }

//   /*** Get count of online users in a room*/
//   async getRoomOnlineCount(roomId: string): Promise<number> {
//     try {
//       const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
//       return await redisClient.sCard(roomKey);
//     } catch (error) {
//       console.error("Error getting room online count:", error);
//       return 0;
//     }
//   }

//   /*** Cache messages for a room (stores latest messages)*/
//   async cacheMessages(roomId: string, messages: any[]): Promise<void> {
//     try {
//       const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
//       await redisClient.set(cacheKey, JSON.stringify(messages), {
//         EX: MESSAGE_CACHE_TTL,
//       });
//       console.log(`Cached ${messages.length} messages for room ${roomId}`);
//     } catch (error) {
//       console.error("Error caching messages:", error);
//     }
//   }

//   /*** Get cached messages for a room*/
//   async getCachedMessages(roomId: string): Promise<any[] | null> {
//     try {
//       const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
//       const cached = await redisClient.get(cacheKey);

//       if (cached) {
//         return JSON.parse(cached);
//       }

//       return null;
//     } catch (error) {
//       console.error("Error getting cached messages:", error);
//       return null;
//     }
//   }

//   /*** Invalidate room cache*/
//   async invalidateRoomCache(roomId: string): Promise<void> {
//     try {
//       const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
//       await redisClient.del(cacheKey);
//       console.log(`Invalidated cache for room ${roomId}`);
//     } catch (error) {
//       console.error("Error invalidating room cache:", error);
//     }
//   }

//   /*** Get user's active rooms*/
//   async getUserRooms(userId: string): Promise<string[]> {
//     try {
//       return await redisClient.sMembers(`${USER_ROOMS_PREFIX}${userId}`);
//     } catch (error) {
//       console.error("Error getting user rooms:", error);
//       return [];
//     }
//   }
// }

// export default new PresenceService();

// src/redis-client/presence.service.ts
import redisClient from "./client";

const ONLINE_USERS_KEY = "online:users";
const ROOM_ONLINE_PREFIX = "room:online:";
const ROOM_CACHE_PREFIX = "room:cache:";
const USER_ROOMS_PREFIX = "user:rooms:";
const MESSAGE_CACHE_TTL = 86400;

export class PresenceService {
  /*** Set user as online*/
  async setUserOnline(userId: string): Promise<void> {
    try {
      await redisClient.sAdd(ONLINE_USERS_KEY, userId);
      await redisClient.setEx(`user:${userId}:status`, 3600, "online");
      console.log(`User ${userId} marked as online`);
    } catch (error) {
      console.error("Error setting user online:", error);
    }
  } /*** Set user as offline*/

  async setUserOffline(userId: string): Promise<void> {
    try {
      await redisClient.sRem(ONLINE_USERS_KEY, userId);
      await redisClient.setEx(`user:${userId}:status`, 3600, "offline");
      console.log(`User ${userId} marked as offline`);
    } catch (error) {
      console.error("Error setting user offline:", error);
    }
  } /*** Check if user is online*/

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      // FIX: Check if the result is 1 to return a boolean
      const result = await redisClient.sIsMember(ONLINE_USERS_KEY, userId);
      return result === 1;
    } catch (error) {
      console.error("Error checking user online status:", error);
      return false;
    }
  } /*** Get all online users*/

  async getOnlineUsers(): Promise<string[]> {
    try {
      return await redisClient.sMembers(ONLINE_USERS_KEY);
    } catch (error) {
      console.error("Error getting online users:", error);
      return [];
    }
  } /*** Add user to room*/

  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    try {
      const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
      await redisClient.sAdd(roomKey, userId);
      await redisClient.sAdd(`${USER_ROOMS_PREFIX}${userId}`, roomId);
      console.log(`User ${userId} added to room ${roomId}`);
    } catch (error) {
      console.error("Error adding user to room:", error);
    }
  } /*** Remove user from room*/

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    try {
      const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
      await redisClient.sRem(roomKey, userId);
      await redisClient.sRem(`${USER_ROOMS_PREFIX}${userId}`, roomId);
      console.log(`User ${userId} removed from room ${roomId}`);
    } catch (error) {
      console.error("Error removing user from room:", error);
    }
  } /*** Get online users in a room*/

  async getRoomOnlineUsers(roomId: string): Promise<string[]> {
    try {
      const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
      return await redisClient.sMembers(roomKey);
    } catch (error) {
      console.error("Error getting room online users:", error);
      return [];
    }
  } /*** Get count of online users in a room*/

  async getRoomOnlineCount(roomId: string): Promise<number> {
    try {
      const roomKey = `${ROOM_ONLINE_PREFIX}${roomId}`;
      return await redisClient.sCard(roomKey);
    } catch (error) {
      console.error("Error getting room online count:", error);
      return 0;
    }
  } /*** Cache messages for a room (stores latest messages)*/

  async cacheMessages(roomId: string, messages: any[]): Promise<void> {
    try {
      const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
      await redisClient.set(cacheKey, JSON.stringify(messages), {
        EX: MESSAGE_CACHE_TTL,
      });
      console.log(`Cached ${messages.length} messages for room ${roomId}`);
    } catch (error) {
      console.error("Error caching messages:", error);
    }
  } /*** Get cached messages for a room*/

  async getCachedMessages(roomId: string): Promise<any[] | null> {
    try {
      const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error("Error getting cached messages:", error);
      return null;
    }
  } /*** Invalidate room cache*/

  async invalidateRoomCache(roomId: string): Promise<void> {
    try {
      const cacheKey = `${ROOM_CACHE_PREFIX}${roomId}:messages`;
      await redisClient.del(cacheKey);
      console.log(`Invalidated cache for room ${roomId}`);
    } catch (error) {
      console.error("Error invalidating room cache:", error);
    }
  } /*** Get user's active rooms*/

  async getUserRooms(userId: string): Promise<string[]> {
    try {
      return await redisClient.sMembers(`${USER_ROOMS_PREFIX}${userId}`);
    } catch (error) {
      console.error("Error getting user rooms:", error);
      return [];
    }
  }
}

export default new PresenceService();
