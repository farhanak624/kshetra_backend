import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import YogaSession from '../models/YogaSession';
import Teacher from '../models/Teacher';
import YogaCourse from '../models/YogaCourse';
import DailyYogaSession from '../models/DailyYogaSession';
import {
  uploadImageToImageKit,
  IMAGE_FOLDERS,
  IMAGE_TRANSFORMATIONS
} from '../utils/imagekitUpload';

// Get all active yoga sessions
export const getAllYogaSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, upcoming, page = 1, limit = 10 } = req.query;

    const query: any = { isActive: true };

    if (type) {
      query.type = type;
    }

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const yogaSessions = await YogaSession.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('instructor', 'name bio profileImage');

    const total = await YogaSession.countDocuments(query);

    res.json({
      success: true,
      data: yogaSessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yoga sessions',
      error: error.message
    });
  }
};

// Get single yoga session by ID
export const getYogaSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const yogaSession = await YogaSession.findById(id)
      .populate('instructor', 'name bio specializations profileImage certifications experience');

    if (!yogaSession) {
      res.status(404).json({
        success: false,
        message: 'Yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: yogaSession
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yoga session',
      error: error.message
    });
  }
};

// Create new yoga session (Admin only)
export const createYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const yogaSession = new YogaSession(req.body);
    await yogaSession.save();

    const populatedSession = await YogaSession.findById(yogaSession._id)
      .populate('instructor', 'name bio profileImage');

    res.status(201).json({
      success: true,
      message: 'Yoga session created successfully',
      data: populatedSession
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to create yoga session',
      error: error.message
    });
  }
};

// Update yoga session (Admin only)
export const updateYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const yogaSession = await YogaSession.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'name bio profileImage');

    if (!yogaSession) {
      res.status(404).json({
        success: false,
        message: 'Yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Yoga session updated successfully',
      data: yogaSession
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update yoga session',
      error: error.message
    });
  }
};

// Delete yoga session (Admin only)
export const deleteYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const yogaSession = await YogaSession.findByIdAndDelete(id);

    if (!yogaSession) {
      res.status(404).json({
        success: false,
        message: 'Yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Yoga session deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete yoga session',
      error: error.message
    });
  }
};

// Get all teachers
export const getAllTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialization, page = 1, limit = 10 } = req.query;

    const query: any = { isActive: true };

    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const teachers = await Teacher.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: teachers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// Get teacher by ID
export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
      return;
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher',
      error: error.message
    });
  }
};

// Create new teacher (Admin only)
export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = new Teacher(req.body);
    await teacher.save();

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to create teacher',
      error: error.message
    });
  }
};

// Update teacher (Admin only)
export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update teacher',
      error: error.message
    });
  }
};

// Delete teacher (Admin only)
export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByIdAndDelete(id);

    if (!teacher) {
      res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete teacher',
      error: error.message
    });
  }
};

// Get yoga session analytics (Admin only)
export const getYogaAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalSessions = await YogaSession.countDocuments({ isActive: true });
    const totalTeachers = await Teacher.countDocuments({ isActive: true });

    const upcomingSessions = await YogaSession.countDocuments({
      isActive: true,
      startDate: { $gte: new Date() }
    });

    const sessionsBy200hr = await YogaSession.countDocuments({
      isActive: true,
      type: '200hr'
    });

    const sessionsBy300hr = await YogaSession.countDocuments({
      isActive: true,
      type: '300hr'
    });

    const totalCapacity = await YogaSession.aggregate([
      { $match: { isActive: true, startDate: { $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$capacity' } } }
    ]);

    const totalBooked = await YogaSession.aggregate([
      { $match: { isActive: true, startDate: { $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$bookedSeats' } } }
    ]);

    const occupancyRate = totalCapacity.length > 0 && totalBooked.length > 0
      ? ((totalBooked[0].total / totalCapacity[0].total) * 100).toFixed(2)
      : 0;

    const popularSpecializations = await Teacher.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$specializations' },
      { $group: { _id: '$specializations', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          totalTeachers,
          upcomingSessions,
          occupancyRate: `${occupancyRate}%`
        },
        sessionsByType: {
          '200hr': sessionsBy200hr,
          '300hr': sessionsBy300hr
        },
        capacity: {
          total: totalCapacity.length > 0 ? totalCapacity[0].total : 0,
          booked: totalBooked.length > 0 ? totalBooked[0].total : 0,
          available: totalCapacity.length > 0 && totalBooked.length > 0
            ? totalCapacity[0].total - totalBooked[0].total
            : 0
        },
        popularSpecializations
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// Get all daily yoga sessions
export const getAllDailyYogaSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    const query: any = { isActive: true };

    if (type) {
      query.type = type;
    }

    const dailySessions = await DailyYogaSession.find(query)
      .sort({ type: 1, price: 1 });

    res.json({
      success: true,
      data: dailySessions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily yoga sessions',
      error: error.message
    });
  }
};

// Get daily yoga session by ID
export const getDailyYogaSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dailySession = await DailyYogaSession.findById(id);

    if (!dailySession) {
      res.status(404).json({
        success: false,
        message: 'Daily yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: dailySession
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily yoga session',
      error: error.message
    });
  }
};

// Create new daily yoga session (Admin only)
export const createDailyYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const dailySession = new DailyYogaSession(req.body);
    await dailySession.save();

    res.status(201).json({
      success: true,
      message: 'Daily yoga session created successfully',
      data: dailySession
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to create daily yoga session',
      error: error.message
    });
  }
};

// Update daily yoga session (Admin only)
export const updateDailyYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dailySession = await DailyYogaSession.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!dailySession) {
      res.status(404).json({
        success: false,
        message: 'Daily yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Daily yoga session updated successfully',
      data: dailySession
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update daily yoga session',
      error: error.message
    });
  }
};

// Delete daily yoga session (Admin only)
export const deleteDailyYogaSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dailySession = await DailyYogaSession.findByIdAndDelete(id);

    if (!dailySession) {
      res.status(404).json({
        success: false,
        message: 'Daily yoga session not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Daily yoga session deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily yoga session',
      error: error.message
    });
  }
};

// Upload teacher profile image
export const uploadTeacherProfileImage = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { id: teacherId } = req.params;

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Upload profile image to ImageKit
    const imageUrl = await uploadImageToImageKit(req.file.buffer, {
      folder: IMAGE_FOLDERS.YOGA.TEACHERS,
      fileName: `teacher_${teacherId}`,
      transformation: IMAGE_TRANSFORMATIONS.PROFILE_PHOTO
    });

    // Update teacher with profile image URL
    teacher.profileImage = imageUrl;
    await teacher.save();

    res.json({
      success: true,
      message: 'Teacher profile image uploaded successfully',
      data: {
        teacher,
        profileImageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload teacher profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload teacher profile image'
    });
  }
};

