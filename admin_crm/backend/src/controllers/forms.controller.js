const Form = require("../models/Form");
const Lead = require("../models/Lead");
const { validationResult } = require("express-validator");

// Controller methods for form management
const formsController = {
  // Get all forms
  getForms: async (req, res) => {
    try {
      const forms = await Form.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
      res.json(forms);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },

  // Get form by ID
  getFormById: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      
      // Optional: Check if user owns the form
      // if (form.createdBy.toString() !== req.user.id) {
      //   return res.status(401).json({ msg: "User not authorized" });
      // }
      
      res.json(form);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.status(500).send("Server Error");
    }
  },

  // Create a new form
  createForm: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, fields } = req.body;
      
      // Create new form
      const form = new Form({
        name,
        description,
        fields,
        createdBy: req.user.id
      });
      
      await form.save();
      
      res.json(form);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },

  // Update a form
  updateForm: async (req, res) => {
    try {
      const { name, description, fields } = req.body;
      
      // Find form by ID
      let form = await Form.findById(req.params.id);
      
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      
      // Check if user owns the form
      if (form.createdBy.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }
      
      // Update fields
      if (name) form.name = name;
      if (description) form.description = description;
      if (fields) form.fields = fields;
      
      form.updatedAt = Date.now();
      
      await form.save();
      
      res.json(form);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.status(500).send("Server Error");
    }
  },

  // Delete a form
  deleteForm: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      
      // Check if user owns the form
      if (form.createdBy.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }
      
      await form.remove();
      
      res.json({ msg: "Form removed" });
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.status(500).send("Server Error");
    }
  },

  // Add a submission to a form
  addSubmission: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { data } = req.body;
      
      const form = await Form.findById(req.params.id);
      
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      
      // Add submission
      const submission = await form.addSubmission(data);
      
      // Automatically create a lead from the submission data
      // Extract email and name (assuming standard field names)
      const email = data.get("email");
      const name = data.get("name");
      
      if (email && name) {
        let lead = await Lead.findOne({ email });
        
        if (!lead) {
          lead = new Lead({
            email,
            name,
            source: "form_submission",
            status: "new",
            company: data.get("company"),
            phone: data.get("phone"),
            notes: `Submitted form: ${form.name}`,
            customFields: data // Store all form data in custom fields
          });
          lead.score = lead.calculateScore();
          await lead.save();
          console.log(`Created new lead from form submission: ${email}`);
        } else {
          // Update existing lead if needed
          lead.activities.unshift({
            type: "note",
            description: `Submitted form: ${form.name}`,
            date: Date.now(),
            completed: true
          });
          lead.lastActivity = Date.now();
          await lead.save();
          console.log(`Updated existing lead from form submission: ${email}`);
        }
      }
      
      res.json(submission);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.status(500).send("Server Error");
    }
  },

  // Get submissions for a form
  getSubmissions: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      
      // Check if user owns the form
      if (form.createdBy.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }
      
      res.json(form.submissions.sort((a, b) => b.submittedAt - a.submittedAt));
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.status(500).send("Server Error");
    }
  }
};

module.exports = formsController;
