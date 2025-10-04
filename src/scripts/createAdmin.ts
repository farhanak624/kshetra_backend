import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resort-booking');
    console.log('📱 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('password', 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      
      console.log('🔄 Admin password updated to: password');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('password', 12);
      
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@gmail.com',
        phone: '+91-9999999999',
        password: hashedPassword,
        role: 'admin'
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
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📱 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdminUser();