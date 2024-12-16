# Bluesky Code Menfess

A simple application for posting and managing anonymous messages (menfess) in a Bluesky-style environment. This project includes database setup, table creation, and basic application instructions.

---

## Features
- **Anonymous Posting**: Users can submit anonymous messages.
- **Admin Moderation**: Admins can approve or reject submissions.
- **Message Categorization**: Messages can be categorized by tags or topics.

---

## Requirements

- **Database**: MySQL or PostgreSQL
- **Backend**: JavaScript
- **Frontend**: HTML, CSS, JavaScript

---

## Database Setup

### Create Database

To set up the database, use the example following SQL query, use the name of the database based what you want to:

```sql
CREATE DATABASE bluesky_code_menfess;
```

### Create Tables

Run these queries to create the required tables:

#### `users` Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `menfess_posts` Table
```sql
CREATE TABLE menfess_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `categories` Table
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Usage

1. Access the application in your browser:

2. Register a new account.
3. Post a menfess message as a user.
4. Approve or reject messages as an admin.

---

## Contributing

If you'd like to contribute, please fork the repository and submit a pull request.

---

## Author

This project was created by **Rifki Ridha**.
