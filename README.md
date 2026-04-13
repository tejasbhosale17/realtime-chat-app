# Real-Time Chat Application

A full-featured real-time chat application built with React, Node.js, Socket.io, and MongoDB. Supports direct messages, group chats, file sharing, reactions, push notifications, and more.

![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black?logo=socket.io)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

## Features

### Messaging

- **Direct Messages** — One-on-one private conversations
- **Group Chats** — Create groups, add/remove members, admin controls
- **Real-time Delivery** — Instant message delivery via WebSockets
- **Message Editing & Deletion** — Edit or delete your sent messages
- **File Sharing** — Upload and share images, videos, audio, and documents (up to 10MB)
- **Emoji Reactions** — React to messages with emojis (👍 ❤️ 😂 😮 😢 🔥)
- **Read Receipts** — See when your messages have been read (✓✓)
- **Typing Indicators** — See when someone is typing in real-time

### Social

- **Friend System** — Send, accept, and reject friend requests
- **User Search** — Find users by name or email
- **Online Presence** — See who's online with live status indicators

### Notifications

- **Push Notifications** — Browser push notifications via Web Push API (VAPID)
- **Unread Badges** — Visual unread message count on conversations

### UI/UX

- **Responsive Design** — Mobile-friendly layout with slide-out sidebar
- **Dark Theme** — Modern dark UI with indigo accents
- **Skeleton Loading** — Smooth loading placeholders
- **Optimistic Updates** — Messages appear instantly before server confirmation
- **Conversation Search** — Filter conversations by name or member

## Tech Stack

### Backend

| Technology                 | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| **Node.js 22**             | Runtime                                             |
| **Express 4.21**           | REST API framework                                  |
| **Socket.io 4.7**          | Real-time WebSocket communication                   |
| **MongoDB 7** (Mongoose 8) | Database                                            |
| **Redis 7** (ioredis)      | Session store, Socket.io adapter, presence tracking |
| **MinIO**                  | S3-compatible file storage                          |
| **JWT**                    | Authentication (access + refresh tokens)            |
| **web-push**               | VAPID push notifications                            |
| **multer**                 | File upload handling                                |
| **helmet**                 | Security headers                                    |
| **express-rate-limit**     | API rate limiting                                   |

### Frontend

| Technology           | Purpose                 |
| -------------------- | ----------------------- |
| **React 18**         | UI library              |
| **Vite 5**           | Build tool & dev server |
| **Tailwind CSS 3**   | Styling                 |
| **Zustand 4**        | State management        |
| **Socket.io Client** | Real-time communication |
| **Axios**            | HTTP client             |
| **React Router 6**   | Routing                 |
| **react-hot-toast**  | Toast notifications     |

### Infrastructure

| Service            | Purpose                         |
| ------------------ | ------------------------------- |
| **Docker Compose** | Container orchestration         |
| **Nginx**          | Frontend server & reverse proxy |
| **MinIO**          | S3-compatible object storage    |

## Project Structure

```
realtime-chat/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .env
│   └── src/
│       ├── server.js              # Entry point
│       ├── app.js                 # Express app setup
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── conversationController.js
│       │   ├── fileController.js
│       │   ├── friendController.js
│       │   └── messageController.js
│       ├── middleware/
│       │   ├── auth.js            # JWT authentication
│       │   ├── errorHandler.js
│       │   └── rateLimiter.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Message.js
│       │   ├── Conversation.js
│       │   └── FriendRequest.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── conversationRoutes.js
│       │   ├── fileRoutes.js
│       │   ├── friendRoutes.js
│       │   ├── messageRoutes.js
│       │   ├── presenceRoutes.js
│       │   └── pushRoutes.js
│       ├── services/
│       │   ├── pushService.js
│       │   └── s3Service.js
│       ├── socket/
│       │   ├── index.js
│       │   └── messageHandlers.js
│       └── utils/
│           ├── redisClient.js
│           └── s3Client.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── public/
    │   └── sw.js                  # Service worker for push notifications
    └── src/
        ├── App.jsx
        ├── index.css
        ├── pages/
        │   ├── Chat.jsx           # Main chat page
        │   ├── Login.jsx
        │   └── Register.jsx
        ├── components/
        │   ├── ChatWindow.jsx
        │   ├── ConversationList.jsx
        │   ├── MessageList.jsx
        │   ├── MessageInput.jsx
        │   ├── NewChatModal.jsx
        │   ├── FriendsPanel.jsx
        │   ├── GroupManagement.jsx
        │   ├── OnlineBadge.jsx
        │   └── TypingIndicator.jsx
        ├── store/
        │   ├── authStore.js
        │   ├── chatStore.js
        │   └── friendStore.js
        ├── hooks/
        │   └── usePushNotifications.js
        └── services/
            ├── api.js             # Axios instance with interceptors
            └── socket.js          # Socket.io client
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- [Node.js 22+](https://nodejs.org/) (only for local development without Docker)

### Quick Start (Docker)

1. **Clone the repository**

   ```bash
   git clone https://github.com/tejasbhosale17/realtime-chat-app.git
   cd realtime-chat-app
   ```

2. **Set up environment variables**

   ```bash
   cp backend/.env.example backend/.env
   ```

   The default `.env` is pre-configured for Docker. To generate your own VAPID keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Start the application**

   ```bash
   docker compose up --build -d
   ```

4. **Open the app**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - MinIO Console: [http://localhost:9001](http://localhost:9001) (minioadmin / minioadmin123)

5. **Stop the application**
   ```bash
   docker compose down
   ```

### Local Development (Without Docker)

You'll need MongoDB, Redis, and MinIO running locally.

1. **Backend**

   ```bash
   cd backend
   npm install
   ```

   Update `.env` to use `localhost` instead of Docker service names:

   ```
   MONGO_URI=mongodb://admin:admin123@localhost:27017/chatapp?authSource=admin
   REDIS_URL=redis://localhost:6379
   S3_ENDPOINT=http://localhost:9000
   ```

   ```bash
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The Vite dev server proxies `/api` and `/socket.io` to `localhost:5000`.

## Environment Variables

| Variable              | Description               | Default                                                         |
| --------------------- | ------------------------- | --------------------------------------------------------------- |
| `PORT`                | Backend server port       | `5000`                                                          |
| `NODE_ENV`            | Environment               | `development`                                                   |
| `MONGO_URI`           | MongoDB connection string | `mongodb://admin:admin123@mongo:27017/chatapp?authSource=admin` |
| `REDIS_URL`           | Redis connection string   | `redis://redis:6379`                                            |
| `JWT_ACCESS_SECRET`   | JWT access token secret   | `chat_access_secret_change_in_production`                       |
| `JWT_REFRESH_SECRET`  | JWT refresh token secret  | `chat_refresh_secret_change_in_production`                      |
| `JWT_ACCESS_EXPIRES`  | Access token TTL          | `15m`                                                           |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL         | `7d`                                                            |
| `S3_ENDPOINT`         | MinIO/S3 endpoint         | `http://minio:9000`                                             |
| `S3_ACCESS_KEY`       | MinIO/S3 access key       | `minioadmin`                                                    |
| `S3_SECRET_KEY`       | MinIO/S3 secret key       | `minioadmin123`                                                 |
| `S3_BUCKET`           | S3 bucket name            | `chat-uploads`                                                  |
| `VAPID_PUBLIC_KEY`    | Web Push public key       | —                                                               |
| `VAPID_PRIVATE_KEY`   | Web Push private key      | —                                                               |
| `VAPID_SUBJECT`       | Web Push contact          | `mailto:admin@chatapp.com`                                      |
| `CLIENT_URL`          | Frontend URL (CORS)       | `http://localhost:3000`                                         |

## API Endpoints

### Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login                |
| POST   | `/api/auth/logout`   | Logout               |
| POST   | `/api/auth/refresh`  | Refresh access token |
| GET    | `/api/auth/me`       | Get current user     |

### Conversations

| Method | Endpoint                                 | Description               |
| ------ | ---------------------------------------- | ------------------------- |
| GET    | `/api/conversations`                     | List user's conversations |
| POST   | `/api/conversations`                     | Create DM or group        |
| PUT    | `/api/conversations/:id`                 | Update group name         |
| PUT    | `/api/conversations/:id/members`         | Add member to group       |
| DELETE | `/api/conversations/:id/members/:userId` | Remove member             |
| POST   | `/api/conversations/:id/leave`           | Leave group               |
| GET    | `/api/conversations/search/users`        | Search users              |

### Messages

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/api/messages/:conversationId` | Get messages (paginated) |

### Friends

| Method | Endpoint                          | Description          |
| ------ | --------------------------------- | -------------------- |
| GET    | `/api/friends`                    | List friends         |
| GET    | `/api/friends/requests`           | List friend requests |
| POST   | `/api/friends/request`            | Send friend request  |
| PUT    | `/api/friends/request/:id/accept` | Accept request       |
| PUT    | `/api/friends/request/:id/reject` | Reject request       |
| DELETE | `/api/friends/:id`                | Remove friend        |

### Files

| Method | Endpoint            | Description                |
| ------ | ------------------- | -------------------------- |
| POST   | `/api/files/upload` | Upload file (multipart)    |
| GET    | `/api/files/url`    | Get presigned download URL |

### Push Notifications

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/push/vapid-key`   | Get VAPID public key  |
| POST   | `/api/push/subscribe`   | Subscribe to push     |
| POST   | `/api/push/unsubscribe` | Unsubscribe from push |

### Presence

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/presence/online` | Check online status of users |

## Socket Events

### Client → Server

| Event                | Payload                                                       | Description               |
| -------------------- | ------------------------------------------------------------- | ------------------------- |
| `join_conversation`  | `conversationId`                                              | Join a conversation room  |
| `leave_conversation` | `conversationId`                                              | Leave a conversation room |
| `send_message`       | `{ conversationId, content, fileUrl?, fileName?, fileType? }` | Send a message            |
| `message_edit`       | `{ messageId, content }`                                      | Edit a message            |
| `message_delete`     | `{ messageId }`                                               | Delete a message          |
| `message_reaction`   | `{ messageId, emoji }`                                        | Toggle reaction           |
| `message_read`       | `{ conversationId }`                                          | Mark messages as read     |
| `typing_start`       | `{ conversationId }`                                          | Start typing indicator    |
| `typing_stop`        | `{ conversationId }`                                          | Stop typing indicator     |

### Server → Client

| Event                      | Payload                           | Description               |
| -------------------------- | --------------------------------- | ------------------------- |
| `new_message`              | `{ conversationId, message }`     | New message received      |
| `conversation_updated`     | `{ conversationId, lastMessage }` | Conversation updated      |
| `message_updated`          | `{ message }`                     | Message edited            |
| `message_deleted`          | `{ messageId }`                   | Message deleted           |
| `message_reaction_updated` | `{ message }`                     | Reaction toggled          |
| `messages_read`            | `{ conversationId, readBy }`      | Messages marked read      |
| `user_typing`              | `{ conversationId, userId }`      | User started typing       |
| `user_stopped_typing`      | `{ conversationId, userId }`      | User stopped typing       |
| `user_online`              | `{ userId }`                      | User came online          |
| `user_offline`             | `{ userId }`                      | User went offline         |
| `group_member_added`       | `{ conversation }`                | Member added to group     |
| `group_member_removed`     | `{ conversation }`                | Member removed from group |
| `removed_from_group`       | `{ conversationId }`              | You were removed          |
| `group_member_left`        | `{ conversation }`                | Member left group         |
| `group_updated`            | `{ conversation }`                | Group details updated     |
| `friend_request_received`  | `{ request }`                     | Incoming friend request   |
| `friend_request_accepted`  | `{ request }`                     | Friend request accepted   |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Nginx (:80) │────▶│ Express (:5000)│
│  React SPA   │◀────│  Frontend    │◀────│   Backend      │
└─────────────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       │ WebSocket (Socket.io)                   │
       └─────────────────────────────────────────┤
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                        ┌─────▼─────┐     ┌──────▼─────┐    ┌──────▼─────┐
                        │  MongoDB  │     │   Redis    │    │   MinIO    │
                        │  (:27017) │     │  (:6379)   │    │  (:9000)   │
                        │  Database │     │  Pub/Sub   │    │  Files     │
                        │           │     │  Presence  │    │  Storage   │
                        └───────────┘     └────────────┘    └────────────┘
```

## License

This project is for educational and portfolio purposes.
