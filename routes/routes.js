// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const caseNotesController = require('../controllers/caseNotesController');
const profileController = require('../controllers/userProfileController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// User Authentication Routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/forgotPassword', userController.forgotPassword);
router.post('/verifyOTP', userController.verifyOTP);
router.post('/resetPassword', userController.resetPassword);

//profile Routes
router.get('/getAllUser', userController.getAllUser);
router.post('/createprofile',upload.single('image'), profileController.createProfile);
router.get('/profile/:user_id', profileController.getUserProfile);
router.put('/updateprofile/:id',upload.single('image'), profileController.updateUserProfile);
router.delete('/deleteprofile/:id',profileController.deleteUserProfile);

// Case Notes Routes
router.post('/api/case-notes', caseNotesController.createCaseNote);
router.get('/api/case-notes', caseNotesController.getAllCaseNotes);
router.get('/api/case-notes/:id', caseNotesController.getCaseNoteById);
router.put('/api/case-notes/:id', caseNotesController.updateCaseNote);
router.delete('/api/case-notes/:id', caseNotesController.deleteCaseNote);





module.exports = router;