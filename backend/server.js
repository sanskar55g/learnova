import express from 'express';

const app = express();
const PORT = 3001;

// Serve static files from backend directory
app.use(express.static('.'));

// Teachers data
const teachers = [
    {name:'Dr. Asha Patel',courses:['Mathematics','Statistics'],freeHours:['Monday 10:00-12:00','Wednesday 14:00-16:00'],availability:['Monday','Wednesday']},
    {name:'Mr. Rohit Singh',courses:['Physics'],freeHours:['Tuesday 09:00-11:00','Thursday 15:00-17:00'],availability:['Tuesday','Thursday']},
    {name:'Ms. Priya Mehta',courses:['Chemistry','Biology'],freeHours:['Monday 13:00-15:00','Friday 10:00-12:00'],availability:['Monday','Friday']},
    {name:'Dr. Sanjay Rao',courses:['Computer Science'],freeHours:['Wednesday 09:00-11:00','Saturday 10:00-13:00'],availability:['Wednesday','Saturday']},
    {name:'Mrs. Leela Kapoor',courses:['English','History'],freeHours:['Tuesday 14:00-16:00','Thursday 09:00-10:30'],availability:['Tuesday','Thursday']},
    {name:'Mr. Amit Verma',courses:['Economics'],freeHours:['Friday 14:00-17:00'],availability:['Friday']}
];

app.get('/', (req, res) => {
    res.sendFile('login.html', { root: '.' });
});

// API endpoint for teachers data
app.get('/api/teachers', (req, res) => {
    res.json(teachers);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});