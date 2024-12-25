// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/userProfileController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// User Authentication Routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/adminLogin', userController.adminLogin);
router.get('/getUser', userController.getUser);

router.post('/createprofile',upload.single('image'), profileController.createProfile);
router.get('/profile/:user_id', profileController.getUserProfile);
router.put('/updateprofile/:id',upload.single('image'), profileController.updateUserProfile);
router.delete('/deleteprofile/:id',profileController.deleteUserProfile);

module.exports = router;