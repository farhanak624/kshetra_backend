import mongoose from 'mongoose';
import Room from '../src/models/Room';
import dotenv from 'dotenv';

dotenv.config();

const additionalRoom = {
  roomNumber: "AC403",
  roomType: "AC" as const,
  pricePerNight: 4500,
  capacity: 4,
  amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Pool View", "Living Area", "Work Desk", "Safe"],
  description: "Premium AC suite with pool view, separate living area and business amenities",
  images: ["https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400", "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400"],
  isAvailable: true
};

async function addOneRoom() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resort-booking');
    console.log('Connected to MongoDB');

    const createdRoom = await Room.create(additionalRoom);
    console.log(`Successfully added room: ${createdRoom.roomNumber} (${createdRoom.roomType}) - ₹${createdRoom.pricePerNight}/night`);

    // Get total count
    const totalRooms = await Room.countDocuments();
    console.log(`Total rooms in database: ${totalRooms}`);

  } catch (error) {
    console.error('Error adding room:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

addOneRoom();