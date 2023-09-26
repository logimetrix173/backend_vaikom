const Group = require('../models/add_group')
const loggs = require('.././models/logsdetails/alllogs')
const jwt = require('jsonwebtoken');
exports.add_group = async (req, res) => {
    try {
      const token = req.header("Authorization");
      const decodedToken = jwt.verify(token, 'acmedms');
      const  email = decodedToken.user.username
      const groupName = req.body.group_name;
      const select_user = req.body.selected_user
      const group_admin= req.body.group_admin
      const level_1 = req.body.level_1
      const level_2 =req.body.level_2
      const existingGroup = await Group.findOne({
        where: { group_name: groupName }
      });
      if (existingGroup) {
        return res.status(409).json({
          message: 'Group name already exists'
        });
      }
      const newGroup = await  Group.create({
        group_name: groupName,
        selected_user:select_user,
        group_admin:group_admin,
        level_1:level_1,
        level_2: level_2
      });
      const loggsfolder = await loggs.create({
        user_id:email,
        category:"Create",
        action:`group created : ${groupName}`,
        timestamp: Date.now(),
        system_ip:"10.10.0.8"
        });
      return res.status(201).json({
        message: 'Group created successfully',
        group: newGroup
      });
      
    } catch (error) { console.error(error);
      return res.status(500).json({
        message: "Server Error"
      });
    }
  };
//     show user to group 
// find user who is in add_user table and group name  is a

// routes/group.js



exports.get_groups = (req, res) => {
  const page = parseInt(req.body.pageNumber) || 1; // set default page to 1
  
  const limit =  parseInt(req.body.pageSize) || 5 
  const offset = (page - 1) * limit;

  Group.findAndCountAll({
    offset,
    limit,
    order: [['createdAt', 'DESC']] 
  })
    .then((result) => {
      const totalPages = Math.ceil(result.count / limit);
      const response = {
        message: "success",
        data: result.rows,
        currentPage: page,
        count:result.count,
        totalPages
      };

      res.status(200).json(response);
    })
    .catch(() => {
      res.status(500).send("An error occurred while trying to fetch groups from the database.");
    });
};
// dropdown
exports.drop_groups = async(req,res)=>{
  try {
    const groups = await Group.findAll();
    res.json({ success: true, message: 'Groups retrieved successfully', groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error while getting groups' });
  }
}


//  delete group
exports.deleteGroup =async (req, res) => {
  try{
  const id = parseInt(req.body.id);
  const token = req.header("Authorization");
  const decodedToken = jwt.verify(token, 'acmedms');
  const  email = decodedToken.user.username
  console.log(email,"_email")
  Group.destroy({
    where: {
      id: id,
    },
  })
    .then(() => {
     
      res.status(200).json({ success: true, message: "delete successfully" });
    })
    const loggsfolder = await loggs.create({
      user_id:email,
      category:"Delete",
      action:`group has been deleted : ${id} `,
      timestamp: Date.now(),
      system_ip:"10.10.0.8"
      });
  }catch (err) {
    return res.status(500).json({ success: false, message: 'group not found' });
}
};
