const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
  try {
    console.log('🚀 Setting up admin user...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resort-booking');
    console.log('📱 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      
      // Update password and ensure admin role
      const hashedPassword = await bcrypt.hash('password', 12);
      await User.updateOne(
        { email: 'admin@gmail.com' },
        { 
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          name: 'System Administrator',
          phone: '+91-9999999999'
        }
      );
      
      console.log('🔄 Admin user updated');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('password', 12);
      
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@gmail.com',
        phone: '+91-9999999999',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('\n🎉 Admin Credentials:');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔒 Password: password');
    console.log('👤 Role: admin');
    console.log('\n🌐 Access admin panel at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    if (error.code === 11000) {
      console.log('ℹ️  Admin user already exists in database');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📱 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdminUser();