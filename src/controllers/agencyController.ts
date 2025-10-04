// @ts-nocheck
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import {
  Agency,
  Vehicle,
  Driver,
  Booking,
  TransportAssignment
} from '../models';
import { AgencyAuthRequest } from '../middleware/agencyAuth';
import { emailService } from '../utils/email';
import {
  uploadImageToImageKit,
  uploadMultipleImages,
  IMAGE_FOLDERS,
  IMAGE_TRANSFORMATIONS
} from '../utils/imagekitUpload';

// Agency Authentication
export const agencyLogin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find agency by username
    const agency = await Agency.findOne({ username }).select('+password');
    if (!agency) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if agency is active
    if (!agency.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Agency account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await agency.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    const token = jwt.sign(
      {
        agencyId: agency._id,
        type: 'agency',
        username: agency.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const agencyData: any = agency.toObject();
    delete agencyData.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        agency: agencyData,
        token
      }
    });
  } catch (error) {
    console.error('Agency login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const agencyProfile = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const agencyData: any = req.agency.toObject();
    delete agencyData.password;

    res.json({
      success: true,
      data: { agency: agencyData }
    });
  } catch (error) {
    console.error('Agency profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Vehicle Management
export const getVehicles = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const vehicles = await Vehicle.find({ agencyId: req.agency._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { vehicles }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createVehicle = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const vehicleData = {
      ...req.body,
      agencyId: req.agency._id
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: { vehicle }
    });
  } catch (error: any) {
    console.error('Create vehicle error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateVehicle = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { id } = req.params;
    const vehicle = await Vehicle.findOne({
      _id: id,
      agencyId: req.agency._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteVehicle = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { id } = req.params;

    // Check if vehicle has active assignments
    const activeAssignments = await TransportAssignment.find({
      vehicleId: id,
      status: { $in: ['assigned', 'in_progress', 'pickup_completed', 'drop_completed'] }
    });

    if (activeAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active assignments'
      });
    }

    const vehicle = await Vehicle.findOneAndDelete({
      _id: id,
      agencyId: req.agency._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Driver Management
export const getDrivers = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const drivers = await Driver.find({ agencyId: req.agency._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { drivers }
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createDriver = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const driverData = {
      ...req.body,
      agencyId: req.agency._id
    };

    const driver = new Driver(driverData);
    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: { driver }
    });
  } catch (error: any) {
    console.error('Create driver error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'License number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateDriver = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { id } = req.params;
    const driver = await Driver.findOne({
      _id: id,
      agencyId: req.agency._id
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    Object.assign(driver, req.body);
    await driver.save();

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: { driver }
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteDriver = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { id } = req.params;

    // Check if driver has active assignments
    const activeAssignments = await TransportAssignment.find({
      driverId: id,
      status: { $in: ['assigned', 'in_progress', 'pickup_completed', 'drop_completed'] }
    });

    if (activeAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete driver with active assignments'
      });
    }

    const driver = await Driver.findOneAndDelete({
      _id: id,
      agencyId: req.agency._id
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Booking Management
export const getBookings = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Find bookings with transport that need assignment or are assigned to this agency
    const bookingsWithTransport = await Booking.find({
      $or: [
        { 'transport.pickup': true },
        { 'transport.drop': true }
      ],
      status: { $ne: 'cancelled' }
    })
    .populate('userId', 'name email phone')
    .populate('roomId', 'name category')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get existing assignments for this agency
    const assignments = await TransportAssignment.find({
      agencyId: req.agency._id
    }).populate('vehicleId driverId');

    // Filter bookings to show only those assigned to this agency or unassigned
    const assignmentMap = new Map();
    assignments.forEach(assignment => {
      assignmentMap.set(assignment.bookingId.toString(), assignment);
    });

    const filteredBookings = bookingsWithTransport.filter(booking => {
      const bookingId = String(booking._id);
      const assignment = assignmentMap.get(bookingId);
      return assignment || !assignmentMap.has(bookingId);
    });

    const totalBookings = filteredBookings.length;

    res.json({
      success: true,
      data: {
        bookings: filteredBookings.map(booking => {
          const bookingObj = booking.toObject();

          // Transform transport data to match frontend expectations
          const transformedBooking = {
            ...bookingObj,
            bookingId: bookingObj._id,
            guestName: bookingObj.primaryGuestInfo?.name || bookingObj.guests?.[0]?.name || bookingObj.userId?.name || 'Guest',
            guestEmail: bookingObj.primaryGuestInfo?.email || bookingObj.userId?.email || 'N/A',
            guestPhone: bookingObj.primaryGuestInfo?.phone || bookingObj.userId?.phone || 'N/A',
            transportInfo: bookingObj.transport ? {
              pickupLocation: `${bookingObj.transport.airportFrom} Airport`,
              dropLocation: 'Kshetra Retreat Resort',
              pickupDateTime: bookingObj.transport.arrivalTime || bookingObj.checkIn,
              pickupTerminal: bookingObj.transport.pickupTerminal,
              dropTerminal: bookingObj.transport.dropTerminal,
              pickupFlightNumber: bookingObj.transport.pickupFlightNumber,
              dropFlightNumber: bookingObj.transport.dropFlightNumber
            } : null,
            assignment: assignmentMap.get(String(booking._id)) || null
          };

          return transformedBooking;
        }),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalBookings,
          hasNextPage: page < Math.ceil(totalBookings / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const assignTransport = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { bookingId } = req.params;
    const { vehicleId, driverId, pickupTime, dropTime, notes } = req.body;

    // Verify booking exists and has transport
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.transport?.pickup && !booking.transport?.drop) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not require transport service'
      });
    }

    // Check if already assigned
    const existingAssignment = await TransportAssignment.findOne({ bookingId });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Transport already assigned for this booking'
      });
    }

    // Verify vehicle belongs to agency and is available
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      agencyId: req.agency._id,
      isAvailable: true
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not available'
      });
    }

    // Verify driver belongs to agency and is available
    const driver = await Driver.findOne({
      _id: driverId,
      agencyId: req.agency._id,
      isAvailable: true
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found or not available'
      });
    }

    // Create transport assignment
    const assignment = new TransportAssignment({
      bookingId,
      agencyId: req.agency._id,
      vehicleId,
      driverId,
      pickupTime,
      dropTime,
      notes,
      status: 'assigned'
    });

    await assignment.save();

    // Mark vehicle and driver as unavailable
    vehicle.isAvailable = false;
    driver.isAvailable = false;
    await Promise.all([vehicle.save(), driver.save()]);

    // Populate assignment data
    await assignment.populate('vehicleId driverId');

    // Send email notification to customer
    const customerEmail = booking.guestEmail || (booking.userId as any)?.email || booking.primaryGuestInfo?.email;
    if (customerEmail) {
      try {
        await emailService.sendEmail({
          to: customerEmail,
          subject: 'Transport Assigned - Booking Confirmation',
          html: `
            <h2>Transport Assignment Confirmation</h2>
            <p>Dear ${booking.primaryGuestInfo?.name || booking.guests[0]?.name || 'Guest'},</p>
            <p>Your transport has been assigned for your booking. Here are the details:</p>

            <h3>Driver Details:</h3>
            <p><strong>Name:</strong> ${driver.name}</p>
            <p><strong>Phone:</strong> ${driver.phone}</p>
            <p><strong>Languages:</strong> ${driver.languages.join(', ')}</p>

            <h3>Vehicle Details:</h3>
            <p><strong>Vehicle:</strong> ${vehicle.brand} ${vehicle.vehicleModel}</p>
            <p><strong>Number:</strong> ${vehicle.vehicleNumber}</p>
            <p><strong>Type:</strong> ${vehicle.vehicleType}</p>
            <p><strong>Capacity:</strong> ${vehicle.capacity} passengers</p>

            <h3>Schedule:</h3>
            ${pickupTime ? `<p><strong>Pickup Time:</strong> ${new Date(pickupTime).toLocaleString()}</p>` : ''}
            ${dropTime ? `<p><strong>Drop Time:</strong> ${new Date(dropTime).toLocaleString()}</p>` : ''}
            ${booking.transport.pickupTerminal ? `<p><strong>Pickup Terminal:</strong> ${booking.transport.pickupTerminal}</p>` : ''}
            ${booking.transport.dropTerminal ? `<p><strong>Drop Terminal:</strong> ${booking.transport.dropTerminal}</p>` : ''}

            ${notes ? `<h3>Special Instructions:</h3><p>${notes}</p>` : ''}

            <p>The driver will contact you before pickup. Please keep your phone accessible.</p>

            <p>Best regards,<br>Kshetra Resort</p>
          `
        });

        assignment.customerNotified = true;
        await assignment.save();
      } catch (emailError) {
        console.error('Failed to send customer notification:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transport assigned successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Assign transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateAssignmentStatus = async (req: AgencyAuthRequest, res: Response) => {
  try {
    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    const { assignmentId } = req.params;
    const { status } = req.body;

    const assignment = await TransportAssignment.findOne({
      _id: assignmentId,
      agencyId: req.agency._id
    }).populate('vehicleId driverId bookingId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    assignment.status = status;

    // If assignment is completed or cancelled, make vehicle and driver available
    if (status === 'completed' || status === 'cancelled') {
      await Vehicle.findByIdAndUpdate(assignment.vehicleId._id, { isAvailable: true });
      await Driver.findByIdAndUpdate(assignment.driverId._id, { isAvailable: true });
    }

    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment status updated successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Image Upload Functions

export const uploadDriverLicense = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { id: driverId } = req.params;

    // Verify driver exists and belongs to agency
    const driver = await Driver.findOne({
      _id: driverId,
      agencyId: req.agency._id
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found or does not belong to your agency'
      });
    }

    // Upload license image to ImageKit
    const imageUrl = await uploadImageToImageKit(req.file.buffer, {
      folder: IMAGE_FOLDERS.DRIVERS.LICENSES,
      fileName: `license_${driverId}`,
      transformation: IMAGE_TRANSFORMATIONS.LICENSE_DOCUMENT
    });

    // Update driver with license image URL
    driver.licenseImage = imageUrl;
    await driver.save();

    res.json({
      success: true,
      message: 'License image uploaded successfully',
      data: {
        driver,
        licenseImageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload driver license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload license image'
    });
  }
};

export const uploadDriverPhoto = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { id: driverId } = req.params;

    // Verify driver exists and belongs to agency
    const driver = await Driver.findOne({
      _id: driverId,
      agencyId: req.agency._id
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found or does not belong to your agency'
      });
    }

    // Upload profile photo to ImageKit
    const imageUrl = await uploadImageToImageKit(req.file.buffer, {
      folder: IMAGE_FOLDERS.DRIVERS.PROFILES,
      fileName: `profile_${driverId}`,
      transformation: IMAGE_TRANSFORMATIONS.PROFILE_PHOTO
    });

    // Update driver with profile photo URL
    driver.profilePhoto = imageUrl;
    await driver.save();

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        driver,
        profilePhotoUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload driver photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo'
    });
  }
};

export const uploadVehicleImages = async (req: AgencyAuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not authenticated'
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { id: vehicleId } = req.params;

    // Verify vehicle exists and belongs to agency
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      agencyId: req.agency._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or does not belong to your agency'
      });
    }

    // Check if adding new images would exceed the limit
    const currentImageCount = vehicle.vehicleImages.length;
    const newImageCount = req.files.length;
    if (currentImageCount + newImageCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${newImageCount} images. Vehicle already has ${currentImageCount} images. Maximum allowed is 10.`
      });
    }

    // Upload vehicle images to ImageKit
    const imageUrls = await uploadMultipleImages(req.files, {
      folder: IMAGE_FOLDERS.VEHICLES,
      fileName: `vehicle_${vehicleId}`,
      transformation: IMAGE_TRANSFORMATIONS.VEHICLE_PHOTO
    });

    // Add new image URLs to vehicle's image array
    vehicle.vehicleImages.push(...imageUrls);
    await vehicle.save();

    res.json({
      success: true,
      message: `${imageUrls.length} vehicle images uploaded successfully`,
      data: {
        vehicle,
        newImageUrls: imageUrls,
        totalImages: vehicle.vehicleImages.length
      }
    });
  } catch (error) {
    console.error('Upload vehicle images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload vehicle images'
    });
  }
};