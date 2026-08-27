import Vehicle from '../models/Vehicle.js';
import { crossValidateDocument } from '../utils/docValidator.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * @desc    Create a new vehicle listing with RC Document and multi-angle photos
 * @route   POST /api/v1/vehicles
 * @access  Private (Host, Admin)
 */
export const createVehicle = async (req, res, next) => {
  try {
    let {
      title,
      make,
      model,
      year,
      category,
      registrationNumber,
      plateNumber,
      specs,
      pricing,
      location,
      images,
      rcDocument,
      documents
    } = req.body;

    // Parse JSON string fields if sent via FormData
    if (typeof specs === 'string') {
      try { specs = JSON.parse(specs); } catch { specs = {}; }
    }
    if (typeof pricing === 'string') {
      try { pricing = JSON.parse(pricing); } catch { pricing = {}; }
    }
    if (typeof location === 'string') {
      try { location = JSON.parse(location); } catch { location = {}; }
    }
    if (typeof rcDocument === 'string') {
      try { rcDocument = JSON.parse(rcDocument); } catch { rcDocument = {}; }
    }
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = [images]; }
    }

    const regNum = (registrationNumber || plateNumber || rcDocument?.rcNumber || '').toUpperCase().trim();
    if (!regNum) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle registration number (RC Number) is mandatory.'
      });
    }

    // Process uploaded files if multipart
    let vehicleImages = Array.isArray(images) ? [...images] : (images ? [images] : []);
    let rcDocUrl = rcDocument?.documentUrl || '';

    // Collect buffer upload promises for Cloudinary
    const uploadTasks = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.fieldname === 'rc_document' || file.fieldname === 'rcDocument') {
            const task = uploadToCloudinary(file.buffer || file.path, { folder: 'primedrew/documents' })
              .then((res) => { rcDocUrl = res.secure_url; });
            uploadTasks.push(task);
          } else if (file.fieldname.startsWith('vehicle_photo') || file.fieldname === 'images' || file.fieldname === 'photos') {
            const task = uploadToCloudinary(file.buffer || file.path, { folder: 'primedrew/vehicles' })
              .then((res) => { vehicleImages.push(res.secure_url); });
            uploadTasks.push(task);
          }
        }
      } else {
        const photoFiles = req.files['images'] || req.files['photos'] || req.files['vehicle_photos'] || [];
        for (const file of photoFiles) {
          const task = uploadToCloudinary(file.buffer || file.path, { folder: 'primedrew/vehicles' })
            .then((res) => { vehicleImages.push(res.secure_url); });
          uploadTasks.push(task);
        }

        const rcFile = req.files['rc_document']?.[0] || req.files['rcDocument']?.[0];
        if (rcFile) {
          const task = uploadToCloudinary(rcFile.buffer || rcFile.path, { folder: 'primedrew/documents' })
            .then((res) => { rcDocUrl = res.secure_url; });
          uploadTasks.push(task);
        }
      }
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    if (vehicleImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 vehicle photo is required (max 6).'
      });
    }

    // Cap at 6 images max
    if (vehicleImages.length > 6) {
      vehicleImages = vehicleImages.slice(0, 6);
    }

    // Automated Document Authenticity & Cross-Name Validation Pipeline
    const extractedName = (rcDocument?.extractedName || req.user.fullName || req.user.name || '').trim();
    const crossValResult = crossValidateDocument(
      { docNumber: regNum, docType: 'RC', extractedName },
      { kycName: req.user.fullName || req.user.name, fullName: req.user.fullName, name: req.user.name }
    );

    const finalRcDoc = {
      rcNumber: regNum,
      documentUrl: rcDocUrl || rcDocument?.documentUrl || 'https://images.unsplash.com/photo-1632823471465-4f46bb4c9f18?auto=format&fit=crop&q=80&w=600',
      extractedName: crossValResult.extractedName,
      nameMatchScore: crossValResult.nameMatchScore,
      isFlaggedForReview: crossValResult.isFlaggedForReview,
      flagReason: crossValResult.flagReason || undefined,
      isVerifiedByAdmin: false
    };

    const vehicle = await Vehicle.create({
      host: req.user._id,
      title: title || `${make} ${model}`,
      make: make || 'Custom',
      model: model || 'Vehicle',
      year: Number(year) || new Date().getFullYear(),
      category: category || 'Sedan',
      registrationNumber: regNum,
      plateNumber: regNum,
      specs: {
        transmission: specs?.transmission || 'Automatic',
        fuelType: specs?.fuelType || 'Petrol',
        seats: Number(specs?.seats) || 5,
        mileageKm: Number(specs?.mileageKm) || 0
      },
      pricing: {
        baseHourlyRate: Number(pricing?.baseHourlyRate) || Math.round((Number(pricing?.baseDailyRate) || 2500) / 10),
        baseDailyRate: Number(pricing?.baseDailyRate) || 2500,
        securityDeposit: Number(pricing?.securityDeposit) || 2000
      },
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [72.8777, 19.0760],
        address: location?.address || 'Mumbai, Maharashtra'
      },
      images: vehicleImages,
      rcDocument: finalRcDoc,
      documents: documents || { rcFrontUrl: rcDocUrl },
      verificationStatus: 'pending',
      status: 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle listing created successfully. Sent to Admin Verification Desk for RC clearance.',
      crossValidation: {
        nameMatchScore: crossValResult.nameMatchScore,
        isFlaggedForReview: crossValResult.isFlaggedForReview,
        flagReason: crossValResult.flagReason
      },
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vehicles with optional filters & geospatial search
 * @route   GET /api/v1/vehicles
 * @access  Public
 */
export const getAllVehicles = async (req, res, next) => {
  try {
    const {
      category,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      lat,
      lng,
      radius = 10,
      status,
      verificationStatus
    } = req.query;

    const isInternalQuery = Boolean(req.user && (req.user.roles?.includes('ADMIN') || req.user.roles?.includes('HOST') || req.user.role === 'ADMIN'));

    // Public users only see APPROVED vehicles
    const targetVerification = verificationStatus
      ? verificationStatus.toLowerCase()
      : isInternalQuery
      ? undefined
      : 'approved';

    // Geospatial search using MongoDB $geoNear aggregation
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const maxDistanceMeters = parseFloat(radius) * 1000;

      const geoMatch = {};
      if (category) geoMatch.category = category;
      if (transmission) geoMatch['specs.transmission'] = transmission;
      if (fuelType) geoMatch['specs.fuelType'] = fuelType;
      if (status) geoMatch.status = status;
      else geoMatch.status = 'available';

      if (targetVerification) {
        geoMatch.verificationStatus = { $regex: new RegExp(`^${targetVerification}$`, 'i') };
      }

      if (minPrice || maxPrice) {
        geoMatch['pricing.baseDailyRate'] = {};
        if (minPrice) geoMatch['pricing.baseDailyRate'].$gte = parseFloat(minPrice);
        if (maxPrice) geoMatch['pricing.baseDailyRate'].$lte = parseFloat(maxPrice);
      }

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distanceMeters',
            maxDistance: maxDistanceMeters,
            query: geoMatch,
            spherical: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'host',
            foreignField: '_id',
            as: 'host'
          }
        },
        {
          $unwind: '$host'
        },
        {
          $project: {
            'host.password': 0,
            'host.bankDetails': 0
          }
        }
      ];

      const vehicles = await Vehicle.aggregate(pipeline);

      return res.status(200).json({
        success: true,
        count: vehicles.length,
        data: vehicles
      });
    }

    // Standard Query Search
    const query = {};

    if (category) query.category = category;
    if (transmission) query['specs.transmission'] = transmission;
    if (fuelType) query['specs.fuelType'] = fuelType;
    if (status) query.status = status;
    else query.status = 'available';

    if (targetVerification) {
      query.verificationStatus = { $regex: new RegExp(`^${targetVerification}$`, 'i') };
    }

    if (minPrice || maxPrice) {
      query['pricing.baseDailyRate'] = {};
      if (minPrice) query['pricing.baseDailyRate'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.baseDailyRate'].$lte = parseFloat(maxPrice);
    }

    const vehicles = await Vehicle.find(query)
      .populate('host', 'name email phone kyc.status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vehicle details by ID
 * @route   GET /api/v1/vehicles/:id
 * @access  Public
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      'host',
      'name email phone kyc.status createdAt'
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle details
 * @route   PUT /api/v1/vehicles/:id
 * @access  Private (Host owner or Admin)
 */
export const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    const isHostOwner = vehicle.host.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isHostOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to update this vehicle.'
      });
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle details updated successfully.',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle listing
 * @route   DELETE /api/v1/vehicles/:id
 * @access  Private (Host owner or Admin)
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    const isHostOwner = vehicle.host.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isHostOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this vehicle.'
      });
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
