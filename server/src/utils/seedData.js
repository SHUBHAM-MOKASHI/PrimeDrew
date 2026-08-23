import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { connectDB } from '../config/db.js';

const sampleHosts = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.host@primedrew.com',
    phone: '9876543210',
    password: 'Password123!',
    roles: ['host', 'renter'],
    kyc: {
      status: 'verified',
      dlNumber: 'MH-02-DL-20249812',
      faceMatchScore: 96
    }
  },
  {
    name: 'Priya Kulkarni',
    email: 'priya.host@primedrew.com',
    phone: '9876543211',
    password: 'Password123!',
    roles: ['host', 'renter'],
    kyc: {
      status: 'verified',
      dlNumber: 'MH-12-DL-20248871',
      faceMatchScore: 94
    }
  }
];

const sampleVehicles = (hostIds) => [
  {
    host: hostIds[0],
    title: 'Tesla Model 3 Performance',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'EV',
    plateNumber: 'MH02EV9821',
    specs: {
      transmission: 'Automatic',
      fuelType: 'EV',
      seats: 5,
      mileageKm: 12500
    },
    pricing: {
      baseHourlyRate: 350,
      baseDailyRate: 4200,
      securityDeposit: 3000
    },
    location: {
      type: 'Point',
      coordinates: [72.8358, 19.0596],
      address: 'Hill Road, Bandra West, Mumbai, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  },
  {
    host: hostIds[1],
    title: 'Mahindra Thar 4x4 Convertible',
    make: 'Mahindra',
    model: 'Thar',
    year: 2023,
    category: 'SUV',
    plateNumber: 'MH12TH4410',
    specs: {
      transmission: 'Manual',
      fuelType: 'Diesel',
      seats: 4,
      mileageKm: 18400
    },
    pricing: {
      baseHourlyRate: 280,
      baseDailyRate: 3200,
      securityDeposit: 2500
    },
    location: {
      type: 'Point',
      coordinates: [72.8697, 19.1136],
      address: 'Andheri East, Metro Station, Mumbai, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  },
  {
    host: hostIds[0],
    title: 'BMW 3 Series M Sport',
    make: 'BMW',
    model: '3 Series',
    year: 2023,
    category: 'Luxury',
    plateNumber: 'MH01BM3300',
    specs: {
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seats: 5,
      mileageKm: 9800
    },
    pricing: {
      baseHourlyRate: 550,
      baseDailyRate: 6500,
      securityDeposit: 5000
    },
    location: {
      type: 'Point',
      coordinates: [72.9080, 19.1176],
      address: 'Hiranandani Gardens, Powai, Mumbai, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  },
  {
    host: hostIds[1],
    title: 'Ather 450X Gen 3 Superbike',
    make: 'Ather',
    model: '450X',
    year: 2024,
    category: 'Bike',
    plateNumber: 'MH02AT4500',
    specs: {
      transmission: 'Automatic',
      fuelType: 'EV',
      seats: 2,
      mileageKm: 3200
    },
    pricing: {
      baseHourlyRate: 80,
      baseDailyRate: 850,
      securityDeposit: 1000
    },
    location: {
      type: 'Point',
      coordinates: [72.8258, 19.1075],
      address: 'Juhu Tara Road, Mumbai, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  },
  {
    host: hostIds[0],
    title: 'Hyundai Verna Turbo DCT',
    make: 'Hyundai',
    model: 'Verna',
    year: 2024,
    category: 'Sedan',
    plateNumber: 'MH03VN1500',
    specs: {
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seats: 5,
      mileageKm: 7400
    },
    pricing: {
      baseHourlyRate: 220,
      baseDailyRate: 2600,
      securityDeposit: 2000
    },
    location: {
      type: 'Point',
      coordinates: [72.8420, 19.0176],
      address: 'Dadar West, Shivaji Park, Mumbai, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  },
  {
    host: hostIds[1],
    title: 'Tata Nexon EV Max',
    make: 'Tata',
    model: 'Nexon EV',
    year: 2024,
    category: 'EV',
    plateNumber: 'MH04NX4000',
    specs: {
      transmission: 'Automatic',
      fuelType: 'EV',
      seats: 5,
      mileageKm: 11200
    },
    pricing: {
      baseHourlyRate: 290,
      baseDailyRate: 3400,
      securityDeposit: 2500
    },
    location: {
      type: 'Point',
      coordinates: [72.9781, 19.2183],
      address: 'Majiwada, Thane West, MH'
    },
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1000'
    ],
    status: 'available',
    verificationStatus: 'approved'
  }
];

export const seedDatabase = async () => {
  try {
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
      console.error('[Seeder] Could not connect to MongoDB database instance.');
      process.exit(1);
    }

    console.log('[Seeder] Clearing existing users and vehicles...');
    await Vehicle.deleteMany({});
    await User.deleteMany({ email: { $in: sampleHosts.map((h) => h.email) } });

    console.log('[Seeder] Creating host user profiles...');
    const createdHosts = [];
    for (const hostData of sampleHosts) {
      const user = new User(hostData);
      await user.save();
      createdHosts.push(user._id);
    }

    console.log('[Seeder] Inserting 6 sample fleet vehicles (Sedan, SUV, EV, Bike)...');
    const vehiclesData = sampleVehicles(createdHosts);
    const insertedVehicles = await Vehicle.insertMany(vehiclesData);

    console.log(`=======================================================`);
    console.log(`[Seeder] Database successfully seeded!`);
    console.log(`[Hosts Created] ${createdHosts.length}`);
    console.log(`[Vehicles Inserted] ${insertedVehicles.length}`);
    console.log(`=======================================================`);

    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
