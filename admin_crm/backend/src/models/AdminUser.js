const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'agent', 'viewer'],
    default: 'viewer'
  },
  permissions: {
    sales_funnel: {
      type: String,
      enum: ['none', 'view', 'edit', 'admin'],
      default: 'none'
    },
    accounting_finance: {
      type: String,
      enum: ['none', 'view', 'edit', 'admin'],
      default: 'none'
    },
    itsm_ticketing: {
      type: String,
      enum: ['none', 'view', 'edit', 'admin'],
      default: 'none'
    },
    social_media: {
      type: String,
      enum: ['none', 'view', 'edit', 'admin'],
      default: 'none'
    },
    system_admin: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if user has permission for a module
AdminUserSchema.methods.hasPermission = function(module, level) {
  // System admins have all permissions
  if (this.permissions.system_admin) {
    return true;
  }
  
  // Check specific module permission
  if (this.permissions[module]) {
    const permissionLevels = ['none', 'view', 'edit', 'admin'];
    const userLevel = permissionLevels.indexOf(this.permissions[module]);
    const requiredLevel = permissionLevels.indexOf(level);
    
    return userLevel >= requiredLevel;
  }
  
  return false;
};

// Static method to find admin users
AdminUserSchema.statics.findAdmins = function() {
  return this.find({ 
    $or: [
      { role: 'admin' },
      { 'permissions.system_admin': true }
    ]
  });
};

// Static method to find users by role
AdminUserSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Static method to find users with module permission
AdminUserSchema.statics.findWithModulePermission = function(module, level) {
  const query = { isActive: true };
  
  // System admins have all permissions
  query.$or = [
    { 'permissions.system_admin': true }
  ];
  
  // Add module-specific permission check
  const moduleQuery = {};
  moduleQuery[`permissions.${module}`] = { $in: level === 'view' ? ['view', 'edit', 'admin'] : level === 'edit' ? ['edit', 'admin'] : ['admin'] };
  query.$or.push(moduleQuery);
  
  return this.find(query);
};

// Create default admin user if none exists
AdminUserSchema.statics.createDefaultAdmin = async function() {
  const adminExists = await this.findOne({ email: 'libinpkurian@gmail.com' });
  
  if (!adminExists) {
    const defaultAdmin = new this({
      email: 'libinpkurian@gmail.com',
      name: 'Dr. Libin Pallikunnel Kurian',
      role: 'admin',
      permissions: {
        sales_funnel: 'admin',
        accounting_finance: 'admin',
        itsm_ticketing: 'admin',
        social_media: 'admin',
        system_admin: true
      }
    });
    
    await defaultAdmin.save();
    console.log('Default admin user created');
    return defaultAdmin;
  }
  
  return adminExists;
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);
