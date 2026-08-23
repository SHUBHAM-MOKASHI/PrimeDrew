import Vehicle from '../models/Vehicle.js';

/**
 * @desc    Create a new vehicle listing
 * @route   POST /api/v1/vehicles
 * @access  Private (Host, Admin)
 */
export const createVehicle = async (req, res, next) => {
  try {
    const {
      title,
      make,
      model,
      year,
      category,
      plateNumber,
      specs,
      pricing,
      location,
      images,
      documents
    } = req.body;

    const vehicle = await Vehicle.create({
      host: req.user._id,
      title,
      make,
      model,
      year,
      category,
      plateNumber,
      specs,
      pricing,
      location,
      images: images || [],
      documents: documents || {},
      verificationStatus: 'pending',
      status: 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle listing created successfully and is pending verification.',
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
      radius = 10, // radius in kilometers (default 10km)
      status,
      verificationStatus
    } = req.query;

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

      if (verificationStatus) geoMatch.verificationStatus = verificationStatus;
      else geoMatch.verificationStatus = 'approved';

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

    if (verificationStatus) query.verificationStatus = verificationStatus;
    else query.verificationStatus = 'approved';

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
