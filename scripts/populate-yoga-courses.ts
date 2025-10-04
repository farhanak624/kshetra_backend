import mongoose from 'mongoose';
import { YogaCourse, Teacher } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sambhubaburaj513_db_user:WhSVkzw5J3WH1d4x@cluster0.siyjsks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const USD_TO_INR_RATE = 84; // Approximate exchange rate

const yogaCoursesData = [
  // YCB Certificate Courses
  {
    courseName: 'Yoga Protocol Instructor - Level 1',
    level: 1,
    type: 'certification' as const,
    courseFeeUSD: 550,
    courseFeePractitionerUSD: 465,
    examinationFeeUSD: 177,
    courseFeeINR: 550 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 465 * USD_TO_INR_RATE,
    examinationFeeINR: 177 * USD_TO_INR_RATE,
    minimumAttendanceDays: '45 days',
    category: 'YCB' as const,
    description: 'YCB Certificate Course - Level 1 Yoga Protocol Instructor certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Basic interest in yoga', 'Commitment to attend minimum required days']
  },
  {
    courseName: 'Yoga Wellness Instructor - Level 2',
    level: 2,
    type: 'certification' as const,
    courseFeeUSD: 650,
    courseFeePractitionerUSD: 550,
    examinationFeeUSD: 206,
    courseFeeINR: 650 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 550 * USD_TO_INR_RATE,
    examinationFeeINR: 206 * USD_TO_INR_RATE,
    minimumAttendanceDays: '2 months',
    category: 'YCB' as const,
    description: 'YCB Certificate Course - Level 2 Yoga Wellness Instructor certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 1 or equivalent experience', 'Basic yoga knowledge']
  },
  {
    courseName: 'Yoga Teacher & Evaluator - Level 3',
    level: 3,
    type: 'certification' as const,
    courseFeeUSD: 900,
    courseFeePractitionerUSD: 760,
    examinationFeeUSD: 236,
    courseFeeINR: 900 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 760 * USD_TO_INR_RATE,
    examinationFeeINR: 236 * USD_TO_INR_RATE,
    minimumAttendanceDays: '3 months',
    category: 'YCB' as const,
    description: 'YCB Certificate Course - Level 3 Yoga Teacher & Evaluator certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 2 or equivalent experience', 'Teaching aptitude', 'Good understanding of yoga principles']
  },
  // Advanced Level Courses
  {
    courseName: 'Yoga Master - Level 4',
    level: 4,
    type: 'certification' as const,
    courseFeeUSD: 1800,
    courseFeePractitionerUSD: 1550,
    examinationFeeUSD: 236,
    courseFeeINR: 1800 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 1550 * USD_TO_INR_RATE,
    examinationFeeINR: 236 * USD_TO_INR_RATE,
    minimumAttendanceDays: '7 months',
    category: 'YCB' as const,
    description: 'Advanced YCB Certificate Course - Level 4 Yoga Master certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 3', 'Significant teaching experience', 'Deep commitment to yoga practice']
  },
  {
    courseName: 'Assistant Yoga Therapist - Level 5',
    level: 5,
    type: 'certification' as const,
    courseFeeUSD: 1250,
    courseFeePractitionerUSD: 1050,
    examinationFeeUSD: 236,
    courseFeeINR: 1250 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 1050 * USD_TO_INR_RATE,
    examinationFeeINR: 236 * USD_TO_INR_RATE,
    minimumAttendanceDays: '5 months',
    category: 'YCB' as const,
    description: 'Advanced YCB Certificate Course - Level 5 Assistant Yoga Therapist certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 4 or medical background', 'Understanding of anatomy and physiology', 'Therapeutic yoga knowledge']
  },
  {
    courseName: 'Yoga Therapist - Level 6',
    level: 6,
    type: 'certification' as const,
    courseFeeUSD: 1700,
    courseFeePractitionerUSD: 1500,
    examinationFeeUSD: 295,
    courseFeeINR: 1700 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 1500 * USD_TO_INR_RATE,
    examinationFeeINR: 295 * USD_TO_INR_RATE,
    minimumAttendanceDays: '6 months',
    category: 'YCB' as const,
    description: 'Advanced YCB Certificate Course - Level 6 Yoga Therapist certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 5', 'Medical knowledge or background', 'Advanced therapeutic yoga skills']
  },
  {
    courseName: 'Therapeutic Yoga Consultant - Level 7',
    level: 7,
    type: 'certification' as const,
    courseFeeUSD: 2000, // Estimated as it was not complete in PDF
    courseFeePractitionerUSD: 1800, // Estimated
    examinationFeeUSD: 350, // Estimated
    courseFeeINR: 2000 * USD_TO_INR_RATE,
    coursFeePractitionerINR: 1800 * USD_TO_INR_RATE,
    examinationFeeINR: 350 * USD_TO_INR_RATE,
    minimumAttendanceDays: '8 months',
    category: 'YCB' as const,
    description: 'Highest level YCB Certificate Course - Level 7 Therapeutic Yoga Consultant certification from Ministry of AYUSH, Government of India',
    prerequisites: ['Completion of Level 6', 'Extensive therapeutic yoga experience', 'Advanced medical knowledge']
  },
  // Regular Yoga Sessions
  {
    courseName: 'Regular Yoga Session',
    level: 1,
    type: 'session' as const,
    courseFeeUSD: Math.round(500 / USD_TO_INR_RATE), // Convert INR to USD
    courseFeePractitionerUSD: Math.round(500 / USD_TO_INR_RATE),
    examinationFeeUSD: 0, // No examination for sessions
    courseFeeINR: 500,
    coursFeePractitionerINR: 500,
    examinationFeeINR: 0,
    category: 'Regular' as const,
    duration: '1.5 hours',
    sessionTimes: ['7:30-9:00 AM', '9:00-10:30 AM', '4:00-5:30 PM'],
    description: 'Regular Yoga Sessions - 1.5 hour sessions available at multiple times throughout the day',
    prerequisites: ['Open to all levels', 'No prior experience required']
  },
  // Yoga Therapy Sessions
  {
    courseName: 'Yoga Therapy Session',
    level: 1,
    type: 'session' as const,
    courseFeeUSD: Math.round(1500 / USD_TO_INR_RATE),
    courseFeePractitionerUSD: Math.round(1500 / USD_TO_INR_RATE),
    examinationFeeUSD: 0,
    courseFeeINR: 1500,
    coursFeePractitionerINR: 1500,
    examinationFeeINR: 0,
    category: 'Therapy' as const,
    duration: '1.5 hours',
    sessionTimes: ['11:00-12:30 PM', '5:30-7:00 PM'],
    description: 'Therapeutic Yoga Sessions - Specialized 1.5 hour therapy sessions focused on healing and rehabilitation',
    prerequisites: ['Medical clearance if required', 'Specific health conditions addressed']
  },
  // Shatkarma/Cleansing Practices
  {
    courseName: 'Shatkarma/Shatkriya Cleansing Practices',
    level: 1,
    type: 'cleansing' as const,
    courseFeeUSD: Math.round(3500 / USD_TO_INR_RATE),
    courseFeePractitionerUSD: Math.round(3500 / USD_TO_INR_RATE),
    examinationFeeUSD: 0,
    courseFeeINR: 3500,
    coursFeePractitionerINR: 3500,
    examinationFeeINR: 0,
    category: 'Cleansing' as const,
    description: 'Shatkarma/Shatkriya session (Cleansing Practices of Hatha Yoga) including Kriya Materials. Pre-booking is compulsory. Only for Yoga Trainers and Practitioners. Includes: Vatkarma, Vyutkarma, Sheetkarma, Jala Neti, Sutra Neti (Thread/Catheter), Vastra Dauti, Kunjal/Gajakarini, Agnisar, Tratak, Moolasodhana. Shakaprakshalana/Laghu shankaprakshalana available upon request and after Medical checkup.',
    prerequisites: [
      'Only for Yoga Trainers and Practitioners',
      'Pre-booking compulsory',
      'Medical checkup required for advanced practices',
      'Previous yoga experience mandatory'
    ]
  }
];

const createSampleTeachers = async () => {
  const existingTeachers = await Teacher.find();

  if (existingTeachers.length === 0) {
    const teachers = [
      {
        name: 'Dr. Priya Sharma',
        bio: 'Senior Yoga Master with 15+ years experience in traditional Hatha and Therapeutic Yoga. Certified by Yoga Alliance and Ministry of AYUSH.',
        specializations: ['Hatha Yoga', 'Therapeutic Yoga', 'Pranayama', 'Meditation'],
        experience: 15,
        certifications: ['YCB Level 7 - Therapeutic Yoga Consultant', 'Yoga Alliance E-RYT 500', 'PhD in Yoga Science'],
        email: 'priya.sharma@kshetra.yoga',
        phone: '+91 9876543210',
        isActive: true
      },
      {
        name: 'Swami Yogananda',
        bio: 'Traditional yoga teacher trained in Rishikesh with deep knowledge of classical yoga texts and practices.',
        specializations: ['Traditional Hatha Yoga', 'Shatkarma', 'Philosophy', 'Meditation'],
        experience: 20,
        certifications: ['YCB Level 6 - Yoga Therapist', 'Traditional Gurukul Training', 'Sanskrit Scholar'],
        email: 'swami.yogananda@kshetra.yoga',
        phone: '+91 9876543211',
        isActive: true
      },
      {
        name: 'Ms. Anjali Patel',
        bio: 'Modern yoga instructor specializing in therapeutic applications and beginner-friendly approaches.',
        specializations: ['Therapeutic Yoga', 'Beginner Yoga', 'Prenatal Yoga', 'Stress Management'],
        experience: 8,
        certifications: ['YCB Level 5 - Assistant Yoga Therapist', 'Prenatal Yoga Certification', 'Stress Management Specialist'],
        email: 'anjali.patel@kshetra.yoga',
        phone: '+91 9876543212',
        isActive: true
      }
    ];

    await Teacher.insertMany(teachers);
    console.log('Sample teachers created successfully');
    return await Teacher.find();
  }

  return existingTeachers;
};

const populateYogaCourses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing yoga courses
    await YogaCourse.deleteMany({});
    console.log('Cleared existing yoga courses');

    // Create sample teachers if they don't exist
    await createSampleTeachers();

    // Insert yoga courses data
    const courses = await YogaCourse.insertMany(yogaCoursesData);
    console.log(`Successfully inserted ${courses.length} yoga courses`);

    // Display the inserted courses
    console.log('\n=== INSERTED YOGA COURSES ===');
    courses.forEach(course => {
      console.log(`\n${course.courseName} (${course.category} - Level ${course.level})`);
      console.log(`  Course Fee: $${course.courseFeeUSD} USD / ₹${course.courseFeeINR} INR`);
      if (course.courseFeePractitionerUSD) {
        console.log(`  Practitioner Fee: $${course.courseFeePractitionerUSD} USD / ₹${course.coursFeePractitionerINR} INR`);
      }
      console.log(`  Exam Fee: $${course.examinationFeeUSD} USD / ₹${course.examinationFeeINR} INR`);
      if (course.minimumAttendanceDays) {
        console.log(`  Minimum Attendance: ${course.minimumAttendanceDays}`);
      }
      if (course.sessionTimes && course.sessionTimes.length > 0) {
        console.log(`  Session Times: ${course.sessionTimes.join(', ')}`);
      }
    });

    console.log('\n=== SUMMARY ===');
    const summary = await YogaCourse.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCourseFeeINR: { $sum: '$courseFeeINR' },
          avgCourseFeeINR: { $avg: '$courseFeeINR' }
        }
      }
    ]);

    summary.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} courses, Avg Fee: ₹${Math.round(cat.avgCourseFeeINR)}`);
    });

  } catch (error) {
    console.error('Error populating yoga courses:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the script
populateYogaCourses()
  .then(() => {
    console.log('Yoga courses populated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to populate yoga courses:', error);
    process.exit(1);
  });