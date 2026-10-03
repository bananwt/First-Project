# Expense Tracker

<!-- Write 1-2 sentences: what does your app do? -->
A full-stack web application for tracking personal finances.
## How to run

<!-- Write the exact steps someone needs to run your project from scratch.
     Assume they have Node.js, PostgreSQL, and VS Code, and nothing else.
     Include: creating the database, running schema.sql, writing the .env file,
     starting the backend, and opening the frontend. -->

**Backend**

1. Create the database in PostgreSQL, and run schema.sql:
     - In pgAdmin or terminal `psql`, create a database named `expense_tracker`:
     ```sql
     CREATE DATABASE expense_tracker;
     ```
     - Run the provided `schema.sql` to generate the table structure and sample data:
     ```
     psql -U postgres -d expense_tracker -f backend/schema.sql
     ```
2. Enter the backend directory and set up the environment:
     ```
     cd backend
     cp .env.example .env
     ```
3. Install dependencies and start the server:
     npm install
     node server.js

The backend will be running at http://localhost:3000

**Frontend**

1. In VSCode, open the frontend folder
2. Right-Click index.html, and select "Open with Live Server".
3. Access the application in your browser at:
     http://127.0.0.1:5500/frontend/index.html

## Features

<!-- List what your app can do. Tick what you finished. -->

- [X] Add an expense (with validation)
- [X] Delete an expense
- [X] Edit an expense
- [X] Filter by category
- [X] Summary cards (total, count, highest)
- [X] Data is saved in a PostgreSQL database
- [x] CSS Grid layout for responsive summary cards
- [x] Real-time title search
- [x] Export expenses to CSV

## Screenshots

<!-- Add 2-3 screenshots of your app (desktop and mobile). -->
https://drive.google.com/drive/folders/15d_gUkMk4s8jPbdW-EBd4j9p31tnmecg?usp=drive_link

## Demo Video

https://drive.google.com/file/d/1kK0ArBPrB7LpTP3QtC0wkdL3FBcRa9Qw/view?usp=drive_link

## What was the hardest part?

<!-- A short paragraph: what got you stuck, and how did you solve it? -->
The hardest part of the project for me was structuring app.js and managing the asynchronous event flow. At first, it was difficult to understand the correct order of operations—specifically how DOM events, asynchronous fetch requests, and interface re-renders needed to coordinate. Attaching event listeners directly to dynamic table buttons failed because those elements did not exist when the page first loaded. I solved this by implementing event delegation on the table body to catch bubbling click events via e.target.closest() and data attributes. Additionally, creating a clear lifecycle around a central refresh() function helped maintain predictable UI updates after every database mutation.