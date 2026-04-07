import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'teacher', 'admin'] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

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
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.username} (${userData.role})`);
      }
    }

    console.log('\n🎉 All users checked/created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Student: student1 / pass123');
    console.log('Teacher: teacher1 / pass123');
    console.log('Admin: lvadmin / admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();