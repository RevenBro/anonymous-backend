const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Admin } = require('@revencoder/anonymous-shared');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB ulandi...');

    const username = 'admin';
    const password = 'admin1234'; // O'zgartiring!
    const email = 'admin@example.com';

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10);

    // Adminni yaratish
    const admin = new Admin({
      username,
      password: hashedPassword,
      email
    });

    await admin.save();
    console.log('✅ Admin muvaffaqiyatli yaratildi!');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Xato:', error.message);
    mongoose.connection.close();
  }
}

createAdmin();