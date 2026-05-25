const Permission = require("../models/permissionModel");

// Récupérer toutes les permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    
    res.status(200).json({
      status: "success",
      results: permissions.length,
      data: { permissions }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Récupérer les permissions par catégorie
exports.getPermissionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const permissions = await Permission.find({ category }).sort({ name: 1 });
    
    res.status(200).json({
      status: "success",
      results: permissions.length,
      data: { permissions }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Créer une permission
exports.createPermission = async (req, res) => {
  try {
    const newPermission = await Permission.create(req.body);
    
    res.status(201).json({
      status: "success",
      data: { permission: newPermission }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Mettre à jour une permission
exports.updatePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!permission) {
      return res.status(404).json({
        status: "fail",
        message: "Permission non trouvée"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: { permission }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Supprimer une permission
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        status: "fail",
        message: "Permission non trouvée"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Permission supprimée"
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};