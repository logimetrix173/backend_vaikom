const express = require('express');

const router = express.Router();

const userController=require('../controllers/auth');

router.post('/signup',userController.register);
router.post('/login',userController.loginUser)

module.exports=router

