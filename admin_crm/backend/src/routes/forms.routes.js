const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// Import controllers
const formsController = require("../controllers/forms.controller");

// Import middleware
const auth = require("../middleware/auth");

// @route   GET api/forms
// @desc    Get all forms
// @access  Private
router.get("/", auth, formsController.getForms);

// @route   GET api/forms/:id
// @desc    Get form by ID
// @access  Private
router.get("/:id", auth, formsController.getFormById);

// @route   POST api/forms
// @desc    Create a new form
// @access  Private
router.post("/", [
  auth,
  [
    check("name", "Name is required").not().isEmpty(),
    check("fields", "Form must have at least one field").isArray({ min: 1 })
  ]
], formsController.createForm);

// @route   PUT api/forms/:id
// @desc    Update a form
// @access  Private
router.put("/:id", auth, formsController.updateForm);

// @route   DELETE api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete("/:id", auth, formsController.deleteForm);

// @route   POST api/forms/:id/submissions
// @desc    Submit data to a form
// @access  Public (or Private depending on use case)
router.post("/:id/submissions", [
  check("data", "Submission data is required").isObject()
], formsController.addSubmission);

// @route   GET api/forms/:id/submissions
// @desc    Get submissions for a form
// @access  Private
router.get("/:id/submissions", auth, formsController.getSubmissions);

module.exports = router;
