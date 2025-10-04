import mongoose from 'mongoose';
import { VehicleRental } from '../models';
import { connectDatabase } from '../config/database';

const sampleVehicles = [
  // 2-wheelers
  {
    name: "Honda Activa 6G",
    type: "2-wheeler",
    category: "scooter",
    brand: "Honda",
    vehicleModel: "Activa 6G",
    year: 2023,
    fuelType: "petrol",
    transmission: "automatic",
    seatingCapacity: 2,
    pricePerDay: 500,
    images: [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/40518/activa-6g-right-front-three-quarter-10.png?q=80"
    ],
    features: [
      "Fuel efficient",
      "Easy to ride",
      "Comfortable seating",
      "Under-seat storage",
      "LED headlight"
    ],
    description: "Perfect for city rides and short distance travel. Fuel efficient and easy to handle.",
    specifications: {
      engine: "109.51cc",
      mileage: "60 kmpl",
      fuelCapacity: "5.3L",
      power: "7.79 bhp",
      topSpeed: "85 kmph"
    },
    availability: {
      isAvailable: true
    },
    location: {
      pickupLocation: "Kshetra Retreat Resort",
      dropLocation: "Kshetra Retreat Resort"
    },
    insurance: {
      included: true,
      coverage: "Third party and comprehensive"
    },
    driverOption: {
      withDriver: false,
      withoutDriver: true
    },
    depositAmount: 2000,
    termsAndConditions: [
      "Valid driving license required",
      "Helmet mandatory",
      "Fuel to be paid by renter",
      "Return in same condition"
    ],
    contactInfo: {
      phone: "+91 9876543210",
      email: "vehicles@kshetraretreat.com"
    },
    isActive: true
  },
  {
    name: "Royal Enfield Classic 350",
    type: "2-wheeler",
    category: "bike",
    brand: "Royal Enfield",
    vehicleModel: "Classic 350",
    year: 2023,
    fuelType: "petrol",
    transmission: "manual",
    seatingCapacity: 2,
    pricePerDay: 1200,
    images: [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/1/versions/royalenfield-classic-350-halcyon-black1658914723041.jpg"
    ],
    features: [
      "Powerful engine",
      "Comfortable for long rides",
      "Classic styling",
      "Good ground clearance",
      "Reliable performance"
    ],
    description: "Experience the thrill of riding a classic motorcycle through Kerala's scenic routes.",
    specifications: {
      engine: "349cc",
      mileage: "35 kmpl",
      fuelCapacity: "13L",
      power: "20.2 bhp",
      topSpeed: "114 kmph"
    },
    availability: {
      isAvailable: true
    },
    location: {
      pickupLocation: "Kshetra Retreat Resort"
    },
    insurance: {
      included: true,
      coverage: "Comprehensive insurance"
    },
    driverOption: {
      withDriver: false,
      withoutDriver: true
    },
    depositAmount: 5000,
    termsAndConditions: [
      "Valid motorcycle license required",
      "Helmet and protective gear mandatory",
      "Experience with manual transmission required",
      "Fuel to be paid by renter"
    ],
    contactInfo: {
      phone: "+91 9876543210",
      email: "vehicles@kshetraretreat.com"
    },
    isActive: true
  },
  // 4-wheelers
  {
    name: "Maruti Suzuki Swift",
    type: "4-wheeler",
    category: "car",
    brand: "Maruti Suzuki",
    vehicleModel: "Swift",
    year: 2023,
    fuelType: "petrol",
    transmission: "manual",
    seatingCapacity: 5,
    pricePerDay: 2000,
    images: [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/54399/swift-exterior-right-front-three-quarter.jpeg"
    ],
    features: [
      "Air conditioning",
      "Power steering",
      "Central locking",
      "Music system",
      "Fuel efficient"
    ],
    description: "Compact and fuel-efficient car perfect for exploring Kerala's roads with family or friends.",
    specifications: {
      engine: "1197cc",
      mileage: "23 kmpl",
      fuelCapacity: "37L",
      power: "82 bhp",
      topSpeed: "165 kmph"
    },
    availability: {
      isAvailable: true
    },
    location: {
      pickupLocation: "Kshetra Retreat Resort"
    },
    insurance: {
      included: true,
      coverage: "Comprehensive insurance"
    },
    driverOption: {
      withDriver: true,
      withoutDriver: true,
      driverChargePerDay: 800
    },
    depositAmount: 10000,
    termsAndConditions: [
      "Valid driving license required",
      "Minimum age 21 years",
      "Fuel to be paid by renter",
      "Driver charges extra if opted"
    ],
    contactInfo: {
      phone: "+91 9876543210",
      email: "vehicles@kshetraretreat.com"
    },
    isActive: true
  },
  {
    name: "Toyota Innova Crysta",
    type: "4-wheeler",
    category: "suv",
    brand: "Toyota",
    vehicleModel: "Innova Crysta",
    year: 2023,
    fuelType: "diesel",
    transmission: "automatic",
    seatingCapacity: 7,
    pricePerDay: 3500,
    images: [
      "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-16.jpeg"
    ],
    features: [
      "Spacious interior",
      "Automatic transmission",
      "Air conditioning",
      "Captain seats",
      "Premium comfort"
    ],
    description: "Spacious and comfortable SUV ideal for large groups and family trips across Kerala.",
    specifications: {
      engine: "2393cc",
      mileage: "15 kmpl",
      fuelCapacity: "55L",
      power: "148 bhp",
      topSpeed: "179 kmph"
    },
    availability: {
      isAvailable: true
    },
    location: {
      pickupLocation: "Kshetra Retreat Resort"
    },
    insurance: {
      included: true,
      coverage: "Comprehensive insurance with zero depreciation"
    },
    driverOption: {
      withDriver: true,
      withoutDriver: true,
      driverChargePerDay: 1200
    },
    depositAmount: 20000,
    termsAndConditions: [
      "Valid driving license required",
      "Minimum age 25 years for self-drive",
      "Driver recommended for long trips",
      "Fuel and toll charges extra"
    ],
    contactInfo: {
      phone: "+91 9876543210",
      email: "vehicles@kshetraretreat.com"
    },
    isActive: true
  }
];

async function seedVehicles() {
  try {
    await connectDatabase();

    // Clear existing vehicles
    await VehicleRental.deleteMany({});
    console.log('Cleared existing vehicles');

    // Insert sample vehicles
    await VehicleRental.insertMany(sampleVehicles);
    console.log('Sample vehicles inserted successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding vehicles:', error);
    process.exit(1);
  }
}

seedVehicles();