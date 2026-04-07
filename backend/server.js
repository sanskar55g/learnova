import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnova';
mongoose.connect(mongoURI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without database connection');
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'teacher', 'admin'] },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
    username: { type: String, required: true },
    role: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// Announcement Schema
const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    targets: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

// Course Material Schema
const courseMaterialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    fileType: { type: String },
    fileData: { type: String }, // Base64 encoded
    targets: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
});

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    monday: { type: String, default: '' },
    tuesday: { type: String, default: '' },
    wednesday: { type: String, default: '' },
    thursday: { type: String, default: '' },
    friday: { type: String, default: '' }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

// Live Session Schema
const liveSessionSchema = new mongoose.Schema({
    teacherUsername: { type: String, required: true },
    teacherName: { type: String, required: true },
    course: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    streamUrl: { type: String }, // URL for the live stream
    sessionId: { type: String, required: true, unique: true },
    participants: [{ type: String }], // List of student usernames
    maxParticipants: { type: Number, default: 100 }
});

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

// Teachers data
const teachers = [
    {name:'Dr. Asha Patel',courses:['Mathematics','Statistics'],freeHours:['Monday 10:00-12:00','Wednesday 14:00-16:00'],availability:['Monday','Wednesday']},
    {name:'Mr. Rohit Singh',courses:['Physics'],freeHours:['Tuesday 09:00-11:00','Thursday 15:00-17:00'],availability:['Tuesday','Thursday']},
    {name:'Ms. Priya Mehta',courses:['Chemistry','Biology'],freeHours:['Monday 13:00-15:00','Friday 10:00-12:00'],availability:['Monday','Friday']},
    {name:'Dr. Sanjay Rao',courses:['Computer Science'],freeHours:['Wednesday 09:00-11:00','Saturday 10:00-13:00'],availability:['Wednesday','Saturday']},
    {name:'Mrs. Leela Kapoor',courses:['English','History'],freeHours:['Tuesday 14:00-16:00','Thursday 09:00-10:30'],availability:['Tuesday','Thursday']},
    {name:'Mr. Amit Verma',courses:['Economics'],freeHours:['Friday 14:00-17:00'],availability:['Friday']}
];

// Initialize default users
async function initializeDefaultUsers() {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected, skipping default user initialization');
            return;
        }

        const defaultUsers = [
            { username: 'student1', password: 'pass123', role: 'student' },
            { username: 'teacher1', password: 'pass123', role: 'teacher' },
            { username: 'lvadmin', password: 'admin123', role: 'admin' }
        ];

        for (const userData of defaultUsers) {
            const existingUser = await User.findOne({ username: userData.username });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const user = new User({
                    username: userData.username,
                    password: hashedPassword,
                    role: userData.role
                });
                await user.save();
                console.log(`Created default user: ${userData.username}`);
            }
        }
    } catch (error) {
        console.error('Error initializing default users:', error);
    }
}

// API Routes

// User Authentication
app.post('/api/login', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not available. Please try again later.' });
        }

        const { username, password, role } = req.body;
        const user = await User.findOne({ username, role });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Log activity
        const activityLog = new ActivityLog({ username, role });
        await activityLog.save();

        res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (role !== 'student' && role !== 'teacher') {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        // Create default schedule for new user
        const schedule = new Schedule({
            username,
            role,
            monday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            tuesday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            wednesday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            thursday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            friday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM'
        });
        await schedule.save();

        res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password field
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new user (admin only)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        // Create default schedule for new user
        const schedule = new Schedule({
            username,
            role,
            monday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            tuesday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            wednesday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            thursday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM',
            friday: role === 'teacher' ? '9:00 AM - 5:00 PM' : 'Classes 9:00 AM - 3:00 PM'
        });
        await schedule.save();

        res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
app.delete('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        await User.findOneAndDelete({ username });
        await Schedule.findOneAndDelete({ username });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get activity logs
app.get('/api/activity', async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get schedules
app.get('/api/schedules', async (req, res) => {
    try {
        const schedules = await Schedule.find();
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Announcements
app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ timestamp: -1 });
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/announcements', async (req, res) => {
    try {
        const { title, message, targets } = req.body;
        const announcement = new Announcement({ title, message, targets });
        await announcement.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Course Materials
app.get('/api/materials', async (req, res) => {
    try {
        const materials = await CourseMaterial.find().sort({ timestamp: -1 });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/materials', async (req, res) => {
    try {
        const { title, description, fileName, fileSize, fileType, fileData, targets } = req.body;
        const material = new CourseMaterial({
            title,
            description,
            fileName,
            fileSize,
            fileType,
            fileData,
            targets
        });
        await material.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error uploading material:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Live Sessions
app.post('/api/sessions/start', async (req, res) => {
    try {
        const { teacherUsername, teacherName, course, title, description } = req.body;
        
        if (!teacherUsername || !course || !title) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = new LiveSession({
            teacherUsername,
            teacherName,
            course,
            title,
            description,
            sessionId,
            streamUrl: `https://stream.example.com/${sessionId}`
        });
        
        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/sessions/active', async (req, res) => {
    try {
        const sessions = await LiveSession.find({ status: 'active' }).sort({ startTime: -1 });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/sessions/all', async (req, res) => {
    try {
        const sessions = await LiveSession.find().sort({ startTime: -1 });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sessions/:sessionId/join', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        const session = await LiveSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        if (!session.participants.includes(username)) {
            session.participants.push(username);
            await session.save();
        }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error joining session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sessions/:sessionId/end', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { teacherUsername } = req.body;

        const session = await LiveSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.teacherUsername !== teacherUsername) {
            return res.status(403).json({ error: 'Only the session teacher can end it' });
        }

        session.status = 'ended';
        session.endTime = new Date();
        await session.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile('login.html', { root: '.' });
});

// API endpoint for teachers data
app.get('/api/teachers', (req, res) => {
    res.json(teachers);
});

// Initialize database and start server
initializeDefaultUsers().catch(err => {
    console.error('Warning: Could not initialize users:', err.message);
});

// Start server regardless of database initialization status
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Ready to accept connections (MongoDB may still be connecting)');
});