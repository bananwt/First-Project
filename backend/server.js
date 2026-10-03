// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

function validateExpenseData(body){
    if (!body || typeof body !== 'object') {
        return 'Request body is required and must be valid JSON.';
    }
    const {title, amount, category, date} = body;

    if(!title || typeof title !== 'string' || title.trim() === ''){
        return 'Title is required and must be text.';
    }

    const numAmount = parseFloat(amount);
    if(isNaN(numAmount) || numAmount <= 0){
        return 'Amount must be a number greater than 0.';
    }

    if(!category || !ALLOWED_CATEGORIES.includes(category)){
        return `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Date is required in YYYY-MM-DD format.';
    }

    return null;

}

// GET /api/expenses
app.get('/api/expenses', async (req, res) => {
    try{
        const query = `
            SELECT id, title, amount::float AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            ORDER BY id ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error retrieving expenses.'});
    }
    
});

// GET /api/expenses/:id
app.get('/api/expenses/:id', async (req, res) => {
    const {id} = req.params;

    if(!/^\d+$/.test(id)){
        return res.status(404).json({message: 'Expense not found (invalid ID).'});
    }

    try{
        const query = `
            SELECT id, title, amount::float AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            WHERE id = $1;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found.' });
    }
        res.status(200).json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error retrieving expenses.'});
    }
    
});

// POST /api/expenses
app.post('/api/expenses', async (req, res) => {
    const errorMsg= validateExpenseData(req.body);
    
    if (errorMsg){
        return res.status(400).json({message: errorMsg});
    }

    const {title, amount, category, date} = req.body;

    try{
        const query = `
            INSERT INTO expenses (title, amount, category, date)
            VALUES ($1, $2, $3, $4)
            RETURNING
                id, title, amount::float AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date;
            
        `;
        const values = [title.trim(), parseFloat(amount), category, date];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error adding expenses.'});
    }
    
});

// PUT /api/expenses/:id
app.put('/api/expenses/:id', async(req, res) =>{
    const {id}= req.params;

    if(!/^\d+$/.test(id)){
        return res.status(404).json({message: 'Expense not found (invalid ID).'});
    }

    const errorMsg = validateExpenseData(req.body);
    if(errorMsg){
        return res.status(400).json({message: errorMsg});
    }

    const {title, amount, category, date} = req.body;

    try{
        const query = `
            UPDATE expenses
            SET title = $1, amount = $2, category = $3, date = $4
            WHERE id = $5
            RETURNING
                id, title, amount::float AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date;
        `;
        
        const values = [title.trim(), parseFloat(amount), category, date, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0){
            return res.status(404).json({message: 'Expense not found.'});
        }
        res.status(200).json(result.rows[0]);
    } catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error updating expense.'})
    }
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', async(req, res) => {
    const {id} = req.params;

    if(!/^\d+$/.test(id)){
        return res.status(404).json({message: 'Expense not found (invalid ID).'});
    }

    try{
        const query =`
            DELETE FROM expenses
            WHERE id = $1 
            RETURNING id;
        `;
        const result = await pool.query(query, [id]);

        if(result.rows.length === 0){
            return res.status(404).json({message: 'Expense not found.'});
        }

        res.status(200).json({message: 'Expense deleted successfully.'});
    } catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error deleting expense.'});
    }

});

app.listen(PORT, ()=>{
    console.log(`Server listening on http://localhost:${PORT}`)
})