const mongoose = require("mongoose");

const FormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fields: [{
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "email", "phone", "textarea", "select", "checkbox", "radio"],
      default: "text"
    },
    options: [{
      type: String
    }],
    required: {
      type: Boolean,
      default: false
    }
  }],
  submissions: [{
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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

// Method to add a submission
FormSchema.methods.addSubmission = async function(submissionData) {
  this.submissions.push({ data: submissionData });
  await this.save();
  return this.submissions[this.submissions.length - 1];
};

module.exports = mongoose.model("Form", FormSchema);
