const Role = require("../models/roleModel");
const Permission = require("../models/permissionModel");

exports.getAllRoles = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    // 🔎 Si recherche présente
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const roles = await Role.find(filter)
      .populate({
        path: 'permissions',
        select: 'name category description isActive'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: roles.length,
      data: { roles }
    });

  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Créer un rôle
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Vérifier que les permissions existent
    if (permissions && permissions.length > 0) {
      const existingPermissions = await Permission.find({
        _id: { $in: permissions }
      });
      
      if (existingPermissions.length !== permissions.length) {
        return res.status(400).json({
          status: "fail",
          message: "Certaines permissions n'existent pas"
        });
      }
    }
    
    const newRole = await Role.create({
      name,
      description,
      permissions
    });
    
    // Populer les permissions dans la réponse
    await newRole.populate('permissions');
    
    res.status(201).json({
      status: "success",
      data: { role: newRole }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Mettre à jour un rôle
exports.updateRole = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    // Vérifier que les permissions existent
    if (permissions && permissions.length > 0) {
      const existingPermissions = await Permission.find({
        _id: { $in: permissions }
      });
      
      if (existingPermissions.length !== permissions.length) {
        return res.status(400).json({
          status: "fail",
          message: "Certaines permissions n'existent pas"
        });
      }
    }
    
    const role = await Role.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Rôle non trouvé"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: { role }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Ajouter des permissions à un rôle
exports.addPermissionsToRole = async (req, res) => {
  try {
    const { permissions } = req.body; // Array d'IDs de permissions
    
    if (!permissions || permissions.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Aucune permission fournie"
      });
    }
    
    // Vérifier que les permissions existent
    const existingPermissions = await Permission.find({
      _id: { $in: permissions }
    });
    
    if (existingPermissions.length !== permissions.length) {
      return res.status(400).json({
        status: "fail",
        message: "Certaines permissions n'existent pas"
      });
    }
    
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { permissions: { $each: permissions } } }, // Évite les doublons
      { new: true }
    ).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Rôle non trouvé"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: { role }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Retirer des permissions d'un rôle
exports.removePermissionsFromRole = async (req, res) => {
  try {
    const { permissions } = req.body; // Array d'IDs de permissions
    
    if (!permissions || permissions.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Aucune permission fournie"
      });
    }
    
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { $pull: { permissions: { $in: permissions } } },
      { new: true }
    ).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Rôle non trouvé"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: { role }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// Supprimer un rôle
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Rôle non trouvé"
      });
    }
    
    if (role.isSystemRole) {
      return res.status(403).json({
        status: "fail",
        message: "Impossible de supprimer un rôle système"
      });
    }
    
    await Role.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      message: "Rôle supprimé"
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};
// Récupérer un seul rôle par ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Rôle non trouvé"
      });
    }

    res.status(200).json({
      status: "success",
      data: { role }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};