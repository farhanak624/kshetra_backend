import mongoose from 'mongoose';
import { YogaCourse } from '../src/models';

const MONGODB_URI = 'mongodb+srv://sambhubaburaj513_db_user:WhSVkzw5J3WH1d4x@cluster0.siyjsks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function verifyCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    const courses = await YogaCourse.find().sort({ level: 1, category: 1 });

    console.log('=== YOGA COURSES IN DATABASE ===');
    courses.forEach(course => {
      console.log(`${course.courseName} (${course.category} Level ${course.level})`);
      console.log(`  Fee: Rs.${course.courseFeeINR} | Type: ${course.type}`);
      if (course.sessionTimes && course.sessionTimes.length > 0) {
        console.log(`  Session Times: ${course.sessionTimes.join(', ')}`);
      }
      console.log('');
    });

    console.log(`Total courses: ${courses.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyCourses().then(() => process.exit(0)).catch(console.error);