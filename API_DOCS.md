# API Documentation

**Base URL:** `https://cybernauts-backend-lb3k.onrender.com/api`
*(For local development, use `http://localhost:5000/api`)*

This document outlines all the available endpoints for the Interactive User Relationship & Hobby Network API, as specified in the project requirements.

## Key Design Principle: State Sync

To ensure frontend-backend data consistency, every `POST`, `PUT`, or `DELETE` request that modifies data (e.g., creating a user, linking friends, updating hobbies) does **not** return just the modified object.

Instead, it re-calculates all scores and returns the **complete, updated graph data object** (the same object returned by `GET /api/graph`). This allows the frontend (Redux) to update its entire state with a single action, preventing any data inconsistencies.

---

## User Endpoints

### 1. `GET /api/users`

* **Description:** Fetches a simple list of all users.
* **Response:** `200 OK`
    ```json
    {
      "status": "success",
      "count": 2,
      "data": [
        {
          "id": "a1b2c3d4-...",
          "username": "Alice",
          "age": 30,
          "hobbies": ["Gaming", "Reading"],
          "friends": ["e5f6g7h8-..."],
          "createdAt": "2025-11-08T10:30:00.000Z"
        },
        {
          "id": "e5f6g7h8-...",
          "username": "Bob",
          "age": 25,
          "hobbies": ["Reading", "Hiking"],
          "friends": ["a1b2c3d4-..."],
          "createdAt": "2025-11-08T10:31:00.000Z"
        }
      ]
    }
    ```

### 2. `POST /api/users`

* **Description:** Creates a new user.
* **Body (raw JSON):**
    ```json
    {
      "username": "Charlie",
      "age": 40,
      "hobbies": ["Cooking"]
    }
    ```
* **Response:** `200 OK`
    * Returns the complete, updated graph data object (see `GET /api/graph` for structure).

### 3. `PUT /api/users/:id`

* **Description:** Updates an existing user's information (username, age, or hobbies).
* **Example URL:** `.../api/users/a1b2c3d4-...`
* **Body (raw JSON):**
    ```json
    {
      "username": "AliceV2",
      "age": 31,
      "hobbies": ["Gaming", "Reading", "Coding"]
    }
    ```
* **Response:** `200 OK`
    * Returns the complete, updated graph data object (see `GET /api/graph` for structure).

### 4. `DELETE /api/users/:id`

* **Description:** Deletes a user.
* **Example URL:** `.../api/users/a1b2c3d4-...`
* **Response:** `200 OK`
    * Returns the complete, updated graph data object (see `GET /api/graph` for structure).
* **Error Response:** `409 Conflict`
    * Triggered if the user still has friends (`friends` array is not empty).
    ```json
    {
      "status": "fail",
      "message": "Cannot delete user. Please unlink all friendships first."
    }
    ```

---

## Relationship Endpoints

### 1. `POST /api/users/:id/link`

* **Description:** Creates a mutual friendship between two users.
* **Example URL:** `.../api/users/a1b2c3d4-.../link`
* **Body (raw JSON):**
    ```json
    {
      "friendId": "e5f6g7h8-..."
    }
    ```
* **Response:** `200 OK`
    * Returns the complete, updated graph data object (see `GET /api/graph` for structure).

### 2. `POST /api/users/:id/unlink`

* **Description:** Removes a mutual friendship between two users. (Note: We use `POST` to safely pass a body, as `DELETE` with a body is non-standard).
* **Example URL:** `.../api/users/a1b2c3d4-.../unlink`
* **Body (raw JSON):**
    ```json
    {
      "friendId": "e5f6g7h8-..."
    }
    ```
* **Response:** `200 OK`
    * Returns the complete, updated graph data object (see `GET /api/graph` for structure).

---

## Graph Endpoint

### 1. `GET /api/graph`

* **Description:** This is the primary endpoint for the frontend. It fetches all data needed to render the graph, including computed `popularityScore` and React Flow node `type`.
* **Response:** `200 OK`
    ```json
    {
      "status": "success",
      "data": {
        "nodes": [
          {
            "id": "a1b2c3d4-...",
            "type": "highScoreNode", // or "lowScoreNode"
            "position": { "x": 123.45, "y": -50.22 },
            "data": {
              "id": "a1b2c3d4-...",
              "username": "Alice",
              "age": 31,
              "hobbies": ["Gaming", "Reading", "Coding"],
              "popularityScore": 6.5
            }
          }
        ],
        "edges": [
          {
            "id": "a1b2c3d4-...-e5f6g7h8-...",
            "source": "a1b2c3d4-...",
            "target": "e5f6g7h8-...",
            "animated": true
          }
        ],
        "users": [
          {
            "id": "a1b2c3d4-...",
            "username": "Alice",
            "age": 31,
            "hobbies": ["Gaming", "Reading", "Coding"],
            "friends": ["e5f6g7h8-..."],
            "createdAt": "2025-11-08T10:30:00.000Z",
            "popularityScore": 6.5
          }
        ]
      }
    }
    ```