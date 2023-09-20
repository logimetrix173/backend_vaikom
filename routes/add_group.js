const express = require('express');

const router = express.Router();

const add_userController=require('../controllers/add_group');
const Authenticate=require('../middleware/authorization')


router.post('/add_group',add_userController.add_group);

router.post('/get_groups',add_userController.get_groups);
router.post('/dropdown_groups',add_userController.drop_groups);
router.post('/deletegroup',add_userController.deleteGroup);
module.exports=router
