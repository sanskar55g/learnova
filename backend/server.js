import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Learnova</title></head>
        <body>
            <h1>Welcome to Learnova</h1>
            <button onclick="alert('Button clicked!')">Click Me</button>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});