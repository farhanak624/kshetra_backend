const mongoose = require('mongoose');
const Room = require('../dist/models/Room').default;
require('dotenv').config();

const rooms = [
  // AC Rooms - Premium
  {
    roomNumber: "AC101",
    roomType: "AC",
    pricePerNight: 3500,
    capacity: 2,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Sea View", "Coffee Maker"],
    description: "Premium AC room with stunning sea view and modern amenities",
    images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC102",
    roomType: "AC",
    pricePerNight: 3200,
    capacity: 3,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Garden View", "Tea/Coffee"],
    description: "Spacious AC room with garden view, perfect for small families",
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400", "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC103",
    roomType: "AC",
    pricePerNight: 4000,
    capacity: 4,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Sea View", "Sofa", "Work Desk"],
    description: "Deluxe AC family room with sea view and additional seating area",
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC201",
    roomType: "AC",
    pricePerNight: 3800,
    capacity: 2,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Mountain View", "Jacuzzi"],
    description: "Luxury AC room with mountain view and private jacuzzi",
    images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC202",
    roomType: "AC",
    pricePerNight: 3500,
    capacity: 3,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Garden View", "Sitting Area"],
    description: "Comfortable AC room with garden view and separate sitting area",
    images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC203",
    roomType: "AC",
    pricePerNight: 4200,
    capacity: 4,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Sea View", "Kitchenette", "Living Area"],
    description: "Premium AC suite with sea view, kitchenette and spacious living area",
    images: ["https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=400", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC301",
    roomType: "AC",
    pricePerNight: 3600,
    capacity: 2,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Terrace", "Sea View", "Private Bathroom"],
    description: "Top floor AC room with private terrace and panoramic sea view",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC302",
    roomType: "AC",
    pricePerNight: 3400,
    capacity: 3,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Mountain View", "Work Desk"],
    description: "Quiet AC room with mountain view, ideal for business travelers",
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"],
    isAvailable: true
  },

  // Non-AC Rooms - Budget Friendly
  {
    roomNumber: "NA101",
    roomType: "Non-AC",
    pricePerNight: 1800,
    capacity: 2,
    amenities: ["WiFi", "Fan", "Garden View", "Private Bathroom", "Tea/Coffee"],
    description: "Cozy non-AC room with garden view and modern amenities",
    images: ["https://images.unsplash.com/photo-1540518614846-7eded47ee561?w=400", "https://images.unsplash.com/photo-1455587734955-081b22074882?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA102",
    roomType: "Non-AC",
    pricePerNight: 2100,
    capacity: 3,
    amenities: ["WiFi", "Fan", "Garden View", "Private Bathroom", "Sitting Area"],
    description: "Spacious non-AC room perfect for families, with natural ventilation",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA103",
    roomType: "Non-AC",
    pricePerNight: 2000,
    capacity: 2,
    amenities: ["WiFi", "Fan", "Balcony", "Garden View", "Private Bathroom"],
    description: "Airy non-AC room with private balcony and lush garden views",
    images: ["https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=400", "https://images.unsplash.com/photo-1560448075-bb485b067938?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA201",
    roomType: "Non-AC",
    pricePerNight: 2200,
    capacity: 4,
    amenities: ["WiFi", "Fan", "Mountain View", "Private Bathroom", "Seating Area", "Work Desk"],
    description: "Large non-AC family room with mountain view and ample space",
    images: ["https://images.unsplash.com/photo-1467043153537-a4faa2541c04?w=400", "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA202",
    roomType: "Non-AC",
    pricePerNight: 1900,
    capacity: 2,
    amenities: ["WiFi", "Fan", "Garden View", "Private Bathroom", "Reading Corner"],
    description: "Peaceful non-AC room with garden view and cozy reading corner",
    images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400", "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA203",
    roomType: "Non-AC",
    pricePerNight: 2300,
    capacity: 3,
    amenities: ["WiFi", "Fan", "Balcony", "Sea View", "Private Bathroom", "Mini Kitchen"],
    description: "Non-AC room with partial sea view, balcony and basic kitchen facilities",
    images: ["https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=400", "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA301",
    roomType: "Non-AC",
    pricePerNight: 2400,
    capacity: 4,
    amenities: ["WiFi", "Fan", "Terrace", "Sea View", "Private Bathroom", "Living Area"],
    description: "Top floor non-AC suite with private terrace and sea view",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400", "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA302",
    roomType: "Non-AC",
    pricePerNight: 2000,
    capacity: 2,
    amenities: ["WiFi", "Fan", "Mountain View", "Private Bathroom", "Work Desk", "Balcony"],
    description: "Scenic non-AC room with mountain view and work-friendly setup",
    images: ["https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=400", "https://images.unsplash.com/photo-1426122402199-be02db90eb90?w=400"],
    isAvailable: true
  },

  // Premium Suites
  {
    roomNumber: "AC401",
    roomType: "AC",
    pricePerNight: 5500,
    capacity: 6,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Balcony", "Sea View", "Kitchenette", "Living Room", "Dining Area", "Jacuzzi"],
    description: "Luxury AC penthouse suite with full sea view, kitchenette and premium amenities",
    images: ["https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "AC402",
    roomType: "AC",
    pricePerNight: 4800,
    capacity: 5,
    amenities: ["WiFi", "TV", "AC", "Mini Fridge", "Terrace", "Mountain View", "Living Area", "Kitchenette", "Work Desk"],
    description: "Executive AC suite with mountain view terrace and business amenities",
    images: ["https://images.unsplash.com/photo-1606046428562-5bf51e7d7c6e?w=400", "https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=400"],
    isAvailable: true
  },
  {
    roomNumber: "NA401",
    roomType: "Non-AC",
    pricePerNight: 3200,
    capacity: 6,
    amenities: ["WiFi", "Fan", "Large Terrace", "Sea View", "Private Bathroom", "Living Area", "Kitchen", "Dining Area"],
    description: "Eco-friendly non-AC penthouse with large terrace and full kitchen facilities",
    images: ["https://images.unsplash.com/photo-1587985064135-0366536eab42?w=400", "https://images.unsplash.com/photo-1494203484021-3c454daf4c04?w=400"],
    isAvailable: true
  }
];

async function addRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resort-booking', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing rooms (optional - comment out if you want to keep existing rooms)
    // await Room.deleteMany({});
    // console.log('Cleared existing rooms');

    // Add new rooms
    const createdRooms = await Room.insertMany(rooms);
    console.log(`Successfully added ${createdRooms.length} rooms to the database`);

    // Display summary
    const acRooms = createdRooms.filter(room => room.roomType === 'AC');
    const nonAcRooms = createdRooms.filter(room => room.roomType === 'Non-AC');

    console.log(`\n📊 Summary:`);
    console.log(`AC Rooms: ${acRooms.length}`);
    console.log(`Non-AC Rooms: ${nonAcRooms.length}`);
    console.log(`Total Rooms: ${createdRooms.length}`);

    console.log(`\n💰 Price Range:`);
    const prices = createdRooms.map(room => room.pricePerNight);
    console.log(`Minimum: ₹${Math.min(...prices)}/night`);
    console.log(`Maximum: ₹${Math.max(...prices)}/night`);

    console.log(`\n🛏️ Capacity Range:`);
    const capacities = createdRooms.map(room => room.capacity);
    console.log(`Min Capacity: ${Math.min(...capacities)} guests`);
    console.log(`Max Capacity: ${Math.max(...capacities)} guests`);

  } catch (error) {
    console.error('Error adding rooms:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
addRooms();