const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required !!!!"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Set a valid email !!!"],
    },
    password: {
      type: String,
      required: [true, "Password is required !!!"],
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (cPass) {
          if (!cPass) return true;
          return cPass === this.password;
        },
        message: "Passwords do not match!!!",
      },
    },
    role: {
      type: String,
      default: 'superadmin',
      enum: ['superadmin', 'admin', 'employee'],
    },
    jobTitle: String,
    phoneNumber: String,
    age: Number,
    isActive: {
      type: Boolean,
      default: true
    },
    isCompanyAdmin: {
      type: Boolean,
      default: false
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    pushSubscription: {
      endpoint: { type: String },
      keys: {
        p256dh: { type: String },
        auth:   { type: String },
      },
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push:  { type: Boolean, default: false },
    },
    pass_update_date: {
      type: Date
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  this.confirmPassword = undefined;
  this.pass_update_date = Date.now() - 1000;
});

userSchema.methods.comparePassword = async function (enteredPass, userPassword) {
  return await bcrypt.compare(enteredPass, userPassword);
};

userSchema.methods.passTimestemp = function (JWTiat) {
  if (!this.pass_update_date) return false;
  const passTime = parseInt(this.pass_update_date.getTime() / 1000);
  return JWTiat < passTime;
};

module.exports = mongoose.model("User", userSchema);