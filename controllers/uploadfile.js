const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const FileUpload = require("../models/fileupload");
const Folder = require("../models/folder");
const winston = require("winston");
const uploadfiledoctype = require("../models/uploadfilesdoctype");
const { Op } = require("sequelize");
const Guest = require("../models/link_sharing/linksharing");
const Guestsignup = require("../models/link_sharing/guestsignup");
// const db = require("../util/mongodb");
const { Sequelize } = require("sequelize");
const folder = require("../models/folder");
const loggs = require("../models/logsdetails/alllogs");
const User = require("../models/add_user");
const app = express();
const bodyParser = require("body-parser");
const middleware = require("../middleware/authorization");
const jwt = require("jsonwebtoken");
// const loggs  = require('../models/logsdetails/alllogs')
const Workspace = require("../models/add_workspace");

// Middleware for parsing the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let obj_id;
// const sub_folder = require("../models/subfolder");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
router.use(bodyParser.json());
const url = "mongodb://admin:dms1234@10.10.0.60:27017/admin";
const { ObjectId } = require("mongodb");
const workspace = require("../models/add_workspace");
// Connect to MongoDB
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Create GridFS stream for file operations
const conn = mongoose.connection;
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Set up Multer storage engine using GridFS
const storage = new GridFsStorage({
  url: url,
  file: (req, file) => {
    // console.log(url,"url")

    return {
      filename: file.originalname,
    };
  },
});

const upload = multer({ storage });

//checking user and workspace_quota
const checkFileSize = async (req, res, next) => {
  const parts = req.query.q.split(",");
  const fileSize = parts[0] / 1024;
  const token = req.header("Authorization");
  // console.log(token,"____toevsdvsdsvs")
  const decodedToken = jwt.verify(token, "acmedms");
  const user_id = decodedToken.user.id;
  const email = decodedToken.user.username;
  console.log(decodedToken, "_________decodedToken");
  // const worksapce_namesf =  JSON.parse(req.body.data)
  const workspace_names = parts[1];
  const workspace_namew = await Workspace.findOne({
    where: {
      workspace_name: workspace_names,
    },
  });
  const maxquotaworkspace = workspace_namew.quota;
  const userFileswork = await FileUpload.findAll({
    where: {
      workspace_name: workspace_names,
    },
  });
  let userFileSizework = 0;
  for (const file of userFileswork) {
    userFileSizework += parseInt(file.file_size) / 1024;
  }

  if (userFileSizework + fileSize > maxquotaworkspace) {
    return res.status(203).json({
      message:
        "Workspace Quota Exceeded. Contact Site Admin or Upload less MB file.",
    });
  }

  const demail = await User.findOne({
    where: {
      id: user_id,
    },
  });
  // console.log(demail,"____eff")
  let guest_data = await Guestsignup.findOne({ where: { email: email } });

  if (!demail && guest_data && guest_data.user_status == "active") {
    next();
  }
  const maxquota = demail.max_quota;

  const userFiles = await FileUpload.findAll({
    where: {
      user_id: user_id,
    },
  });
  let userFileSize = 0;
  for (const file of userFiles) {
    userFileSize += parseInt(file.file_size) / 1024;
  }
  if (userFileSize + fileSize > maxquota) {
    return res.status(203).json({
      message: "Quota Exceeded. Contact Site Admin or Upload less MB file.",
    });
  }

  next();
};

router.post("/uploadcreate", checkFileSize, upload.any(), async (req, res) => {
  // const fileSize = req.query.q
  // console.log(req.body.files,"___filebody")
  const token = req.header("Authorization");
  // console.log(token,"____toevsdvsdsvs")
  const decodedToken = jwt.verify(token, "acmedms");
  const user_id = decodedToken.user.id;
  let guest_id;
  const user_type1 = await User.findOne({ where: { id: user_id } });
  let user_type;
  if (!user_type1) {
    guest_id = await Guestsignup.findOne({ where: { id: user_id } });
    // guest_id = user_id
  } else {
    user_type = user_type1.user_type;
  }
  // console.log(req.body.data,"newdata")
  const worksapce_namesf = JSON.parse(req.body.data);
  // const fileSize = (worksapce_namesf.file_Size)/1024
  // console.log(fileSize,"filesize________________")
  // console.log(worksapce_namesf,"_______booo")
  const workspace_names = worksapce_namesf.workspace_name;
  // console.log(workspace_names,"__work")

  const file = req.files;

  const filedataw = file[0].size / 1024;
  const demail = await User.findOne({
    where: {
      id: user_id,
    },
  });
  // console.log(demail,"____eff")
  if (demail) {
    const maxquota = demail.max_quota;
  }
  //  in kb
  // const userFiles = await FileUpload.findAll({
  //     where: {
  //         user_id: user_id

  //     }
  // });
  //     let userFileSize = 0;
  //     for (const file of userFiles) {
  //         userFileSize +=parseInt( file.file_size)/1024;
  //     }
  //     console.log(userFileSize,maxquota,"___filesize*****")
  //  if((userFileSize+fileSize)>maxquota){
  //   return res.status(203).json({message:"Quota Exceeded. Contact Site Admin or Upload less MB file."})
  //  }

  // console.log(user_id,"IIIIvjnjvsd")

  // console.log(file,"fileinapi")
  obj_id = file[0].id.toString();
  //  console.log(obj_id,"mongoiddes")
  // async function getmongoid(obj_id){
  //   return obj_id;
  // }

  const data = JSON.parse(req.body.data);
  // console.log(data,"____data_________-")
  // console.log(data.Feilds_Name,"datat")
  const Fields_Name = data.Feilds_Name;
  const modifiedFields = {};
  Object.keys(Fields_Name).forEach((key, index) => {
    modifiedFields["field" + (index + 1)] = Fields_Name[key];
  });
  // console.log(modifiedFields);
  // console.log(filed_name,"resultrssv")
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const {
      file_size,
      file_type,
      folder_name,
      workspace_name,
      doctype,
      parent_id,
      fileDesc,
      workspace_type,
      workspace_id,
    } = JSON.parse(req.body.data);
    const fileData1 = req.files[0];
    const file_name = fileData1.originalname;
    const extension = file_name.split(".").pop();
    const filed_name = req.body.Fields_Name;
    // console.log(req.body,"njust")
    if (folder_name) {
      const user_id1 = user_type1 ? user_type1.id : null;
      const guest_id_value = guest_id ? guest_id.id : null;

      const uploaddocmetadata = await uploadfiledoctype.create({
        user_id: user_id1,
        guest_id: guest_id_value,
        file_name: file_name,
        doctype: doctype,
        field1: modifiedFields ? modifiedFields.field1 : null,
        field2: modifiedFields ? modifiedFields.field2 : null,
        field3: modifiedFields ? modifiedFields.field3 : null,
        field4: modifiedFields ? modifiedFields.field4 : null,
        field5: modifiedFields ? modifiedFields.field5 : null,
        field6: modifiedFields ? modifiedFields.field6 : null,
        field7: modifiedFields ? modifiedFields.field7 : null,
        field8: modifiedFields ? modifiedFields.field8 : null,
        field9: modifiedFields ? modifiedFields.field9 : null,
        field10: modifiedFields ? modifiedFields.field10 : null,
      });

      // const uploaddocmetadata = await uploadfiledoctype.create({
      //   user_id: user_type1?.id || null,
      //   guest_id: guest_id?.id || null,
      //   file_name: file_name,
      //   doctype: doctype,
      //   field1: modifiedFields ? modifiedFields.field1 : null,
      //   field2: modifiedFields ? modifiedFields.field2 : null,
      //   field3: modifiedFields ? modifiedFields.field3 : null,
      //   field4: modifiedFields ? modifiedFields.field4 : null,
      //   field5: modifiedFields ? modifiedFields.field5 : null,
      //   field6: modifiedFields ? modifiedFields.field6 : null,
      //   field7: modifiedFields ? modifiedFields.field7 : null,
      //   field8: modifiedFields ? modifiedFields.field8 : null,
      //   field9: modifiedFields ? modifiedFields.field9 : null,
      //   field10: modifiedFields ? modifiedFields.field10 : null,
      // });

      // const fileData = req.files[0].buffer;

      // const fileDatastr = req.files[0].str;
      // console.log(fileDatastr,"____________filedatass")
      // Assuming only one file is uploade
      // const extension = file_name.split('.').pop();
      const data1 = file[0].size;
      const newFile = await FileUpload.create({
        levels: 1,
        filemongo_id: obj_id,
        user_id: user_type1?.id || null,
        guest_id: guest_id?.id || null,
        file_name: file_name,
        file_size: data1,
        file_type: extension,
        time_stamp: Date.now(),
        doc_type: doctype,
        folder_name: folder_name,
        workspace_name: workspace_name,
        workspace_id: workspace_id,
        file_description: fileDesc,
        workspace_type: workspace_type,
        user_type: user_type || "guest",
        is_recyclebin: "false",
      });
      let uploadedBy;
      if (newFile.guest_id && newFile.user_id === null) {
        uploadedBy = "By Guest";
      } else {
        uploadedBy = "By User";
      }
      const loggsfolder = await loggs.create({
        // user_id: (demail && demail.email) || null,
        // guest_id: decodedToken.user.username || null,
        user_id: (demail && demail.email) || decodedToken.user.username,
        category: "Upload",
        action: ` File Uploaded : ${file_name} ${uploadedBy}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });

      return res.status(200).json(newFile);
    } else {
      const uploaddocmetadata = await uploadfiledoctype.create({
        user_id: user_id,
        doctype: doctype,
        file_name: file_name,
        field1: modifiedFields ? modifiedFields.field1 : null,
        field2: modifiedFields ? modifiedFields.field2 : null,
        field3: modifiedFields ? modifiedFields.field3 : null,
        field4: modifiedFields ? modifiedFields.field4 : null,
        field5: modifiedFields ? modifiedFields.field5 : null,
        field6: modifiedFields ? modifiedFields.field6 : null,
        field7: modifiedFields ? modifiedFields.field7 : null,
        field8: modifiedFields ? modifiedFields.field8 : null,
        field9: modifiedFields ? modifiedFields.field9 : null,
        field10: modifiedFields ? modifiedFields.field10 : null,
      });
      // const fileData = req.files[0].buffer; // Assuming only one file is uploaded
      // const fileBlob = new Blob([fileData], { type: req.files[0].mimetype });
      //  const fileUrl = URL.createObjectURL(fileBlob);
      //  console.log(fileUrl,"_fileurl")

      const data1 = file[0].size;
      const newFile = await FileUpload.create({
        levels: 0,
        user_id: user_id,
        filemongo_id: obj_id,
        file_name: file_name,
        file_size: data1,
        file_type: extension,
        doc_type: doctype,
        time_stamp: Date.now(),
        folder_name: folder_name,
        workspace_name: workspace_name,
        workspace_id: workspace_id,
        file_description: fileDesc,
        workspace_type: workspace_type,
        user_type: user_type,
        is_recyclebin: "false",
      });
      const loggsfolder = await loggs.create({
        user_id: demail.email,
        category: "Upload",
        action: `File Uploaded By User : ${file_name}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });
      return res
        .status(200)
        .json({ message: "File Upload Successfully", newFile });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/createfolder", upload.none(), async (req, res) => {
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    let user_id;
    let guest_id;

    const id = await User.findOne({ where: { email: email } });
    // const user = await User.findOne({ where: { email: email } });
    if (id) {
      user_id = id.id;
    } else {
      guest_id = decodedToken.user.id;
    }

    // let user_id;
    // // let guest_id;
    // // if(id){
    //  user_id = id.id;
    // // }else{
    // //   guest_id = await Guestsignup.findOne({where: {id:decodedToken.user.id}})
    // // }

    // console.log(guest_id, "_________guestId")
    // const guest_id = await
    const {
      folder_name,
      folder_id,
      workspace_name,
      workspace_type,
      workspace_id,
    } = req.body;

    let levels;

    if (folder_id) {
      // Find the folder with the provided folder_id
      const parentFolder = await Folder.findOne({ where: { id: folder_id } });
      if (!parentFolder) {
        return res.status(404).json({ message: "Parent folder not found." });
      }

      // Increment the level of the parent folder by 1
      levels = parentFolder.levels + 1;

      // Create the folder in the database
      // const response = await User.findOne({ where: { id: user_id } });
      // console.log(response.email, "____email");
      const folder = await Folder.create({
        user_id: user_id || null,
        guest_id: guest_id || null,
        workspace_id: workspace_id,
        folder_name: folder_name,
        levels: levels,
        parent_id: folder_id,
        time_stamp: Date.now(),
        workspace_name: workspace_name,
        workspace_type: workspace_type,
        is_recycle: "false",
      });
      // logger.info(`sub-Folder created: ${folder_name}`);
      const loggsfolder = await loggs.create({
        user_id: email,
        category: "Create",
        action: `Folder Created : ${folder_name}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });
      return res
        .status(201)
        .send({ message: "SUB_Folder created successfully.", folder });
    } else {
      const folder = await Folder.create({
        user_id: user_id,
        workspace_id: workspace_id,
        folder_name: folder_name,
        levels: 0,
        parent_id: 0,
        time_stamp: Date.now(),
        workspace_name: workspace_name,
        workspace_type: workspace_type,
        is_recycle: "false",
      });
    }

    const loggsfolder = await loggs.create({
      user_id: email,
      category: "Create",
      action: `Folder Created : ${folder_name}`,
      timestamp: Date.now(),
      system_ip: "10.10.0.8",
    });
    // console.log(loggsfolder,"loggs")
    return res
      .status(201)
      .json({ message: "Folder Created Successfully.", folder });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error creating folder:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});
router.post("/getfoldernames", async (req, res) => {
  try {
    const { workspace_name, workspace_id } = req.body;

    const workspace_type1 = await Workspace.findOne({
      where: { workspace_name: workspace_name },
    });
    if(!workspace_type1 ){
    console.log("work_space not found");
    }
    let workspace_type = workspace_type1.workspace_type;
    //  console.log(workspace_type1,"fefe")
    // Team space aaya yha se
    const id = parseInt(req.body.parent_id);
    const levels = parseInt(req.body.levels);
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const user_id = decodedToken.user.id;
    // console.log(user_id,"this is userId from getFolder")
    // const workspace_type = req.body.workspace_type

    async function FolderAndFilesSize(folders) {
      async function calculateFolderSize(folder, totalSize) {
        const files = await FileUpload.findAll({
          where: {
            is_recyclebin: "false",
            folder_name: folder.folder_name,
          },
        });
    
        for (const file of files) {
          totalSize += parseInt(file.file_size);
        }
    
        const childFolders = await Folder.findAll({
          where: {
            is_recycle: "false",
            parent_id: folder.id,
          },
        });
    
        for (const childFolder of childFolders) {
          totalSize = await calculateFolderSize(childFolder, totalSize);
        }
    
        folder.dataValues.folder_size = totalSize;
        return totalSize;
      }
    
      for (let folder of folders) {
        let totalSize = 0;
        totalSize = await calculateFolderSize(folder, totalSize);
      }
    }
    
    // async function FolderAndFilesSize(folders) {
    //   for (let folder of folders) {
    //     const files = await FileUpload.findAll({
    //       where: {
    //         is_recyclebin: "false",
    //         folder_name: folder.folder_name,
    //       },
    //     });
    
    //     let totalSize = 0;
    
    //     for (const file of files) {
    //       totalSize += parseInt(file.file_size);
    //     }
    //     // folder.dataValues.folder_size = totalSize;
    //     const childFolders = await Folder.findAll({
    //       where: {
    //         is_recycle: "false",
    //         parent_id: folder.id,
    //       },
    //     });
    
    //     for (const childFolder of childFolders) {
    //       console.log([childFolder],"________childFolder")
    //       await FolderAndFilesSize([childFolder]);
    //     }
    //       folder.dataValues.folder_size = totalSize;
    //   }
    // }

    // console.log(user_id,"___vn")
    // console.log(req.body,"_____body")
    if (id && levels) {
      const folder_name = await Folder.findOne({
        where: {
          id: id,
          workspace_name: workspace_name,
          [Op.or]: [
            { workspace_type: workspace_type },
            { workspace_type: "Guest" },
          ],
        },
        attributes: ["folder_name"],
      });

      const folders = await Folder.findAll({
        where: {
          levels: levels,
          parent_id: id,
          // user_id:user_id,
          workspace_name: workspace_name,
          // workspace_id: workspace_id,
          // workspace_type: workspace_type,
          is_recycle: "false",
        },
      });

      const find_user_data = await User.findOne({
        where: {
          id: user_id,
        },
      });
      const guest_data = await Guest.findAll();
      // Define a function to add sharedBy and shareWith to an object
      function addSharedInfo(object, sharedData) {
        const user_type = find_user_data.user_type;
        object.dataValues.user_type = user_type;
        const user_email = find_user_data.email;
        object.dataValues.user_email = user_email;

        const sharedInfo = {
          shared_by: [],
          share_with: [],
        };
        sharedData.forEach(async (data)  => {
          let guest_approved = await Guest.findOne({where:{
            folder_id:data.folder_id
          },
          attributes: ["is_approved1", "is_approved2"],
        })
        // console.log(guest_approved,"__________guest_approved")
          if (data.folder_id === object.id) {
            sharedInfo.shared_by.push(data.shared_by);
          if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "true") {
            sharedInfo.share_with.push(data.guest_email);
          } else if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "false") {
            sharedInfo.share_with.push("L1 has approved and L2 is pending");
          } else if (guest_approved.is_approved2 === "true" && guest_approved.is_approved1 ==="false") {
            sharedInfo.share_with.push("L2 has approved and L1 is pending ");
          } else {
            if (guest_approved.is_approved1 === "false") {
              sharedInfo.share_with.push("L1 is pending");
            } else if (guest_approved.is_approved1 === "denied") {
              sharedInfo.share_with.push("L1 has Declined");
            }
          
            if (guest_approved.is_approved2 === "false") {
              sharedInfo.share_with.push("L2 is pending");
            } else if (guest_approved.is_approved2 === "denied") {
              sharedInfo.share_with.push("L2 has Declined");
            }
          }
            object.dataValues.expiry_date = data.expiry_date;
          } else if (data.file_id === object.id) {
            sharedInfo.shared_by.push(data.shared_by);
            if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "true") {
              sharedInfo.share_with.push(data.guest_email);
            } else if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "false") {
              sharedInfo.share_with.push("L1 has approved and L2 is pending");
            } else if (guest_approved.is_approved2 === "true" && guest_approved.is_approved1 ==="false") {
              sharedInfo.share_with.push("L2 has approved and L1 is pending ");
            } else {
              if (guest_approved.is_approved1 === "false") {
                sharedInfo.share_with.push("L1 is pending");
              } else if (guest_approved.is_approved1 === "denied") {
                sharedInfo.share_with.push("L1 has Declined");
              }
            
              if (guest_approved.is_approved2 === "false") {
                sharedInfo.share_with.push("L2 is pending");
              } else if (guest_approved.is_approved2 === "denied") {
                sharedInfo.share_with.push("L2 has Declined");
              }
            }            
            // sharedInfo.share_with.push(data.guest_email);
            object.dataValues.expiry_date = data.expiry_date;
          }
        });
        // Assign the arrays to the object.dataValues
        object.dataValues.shared_by = sharedInfo.shared_by;
        object.dataValues.share_with = sharedInfo.share_with;
      }

      // Apply the function to folders
      folders.forEach((folder) => {
        addSharedInfo(folder, guest_data);
      });

      const files = await FileUpload.findAll({
        where: {
          folder_name: folder_name.folder_name,
          workspace_name: workspace_name,
          is_recyclebin: "false",
        },
        attributes: [
          "id",
          "user_id",
          "file_name",
          "file_type",
          "file_size",
          "updatedAt",
          "filemongo_id",
          "user_type",
          "folder_name"
        ],
      });
      // Apply the function to files (assuming you have a 'files' array)
      files.forEach((file) => {
        addSharedInfo(file, guest_data);
      });

      await FolderAndFilesSize(folders)

      
      // Apply the function to folders
      // let all_folder = await Folder.findAll({
      //   where: {
      //     levels: levels + 1,
      //     // parent_id: id,
      //     workspace_name: workspace_name,
      //     is_recycle: "false",
      //   },
      // });

      // for (let j = 0; j < all_folder.length; j++) {
      //   let one_folder = all_folder[j];
      //   // console.log(one_folder,"________onefolder")
      //   let totalSize = 0;

      //   for (let i = 0; i < files.length; i++) {
      //     let one_file = files[i];
      //     if (
      //       one_file.levels === "1" &&
      //       one_folder.folder_name === one_file.folder_name
      //     ) {
      //       totalSize += parseInt(files[i].file_size, 10); // Add the file_size to the totalSize
      //     }
      //     console.log(totalSize, ` one_folder.totalSize `);
      //   }
      // }

      // let fileSizeOfFolder = 0;
      // for (let j = 0; j < all_folder.length; j++) {
      //   let one_folder = all_folder[j]
      //   for (let i = 0; i < files.length; i++) {
      //     if (files[i].levels == "1" && one_folder.folder_name==files[i].folder_name ){
      //       console.log(files[i], `${i}________files`);
      //       fileSizeOfFolder += parseInt(files[i].file_size, 10); // Parse the file_size property
      //     }
      //   }
      // }

      // console.log(fileSizeOfFolder,"_________fileSize")
      // Return the folder names

      return res.status(200).json({ folders, files });
    } else {
      // Retrieve folder names where levels = 0
      const files = await FileUpload.findAll({
        where: {
          levels: "0",
          workspace_name: workspace_name,
          workspace_id: workspace_id,
          is_recyclebin: "false",
          //  user_id:user_id
        },
        attributes: [
          "id",
          "user_id",
          "file_name",
          "file_type",
          "file_size",
          "updatedAt",
          "filemongo_id",
          "user_type",
        ],
      });
      const folders = await Folder.findAll({
        where: {
          levels: "0",
          // user_id:user_id,
          workspace_name: workspace_name,
          workspace_type: workspace_type,
          workspace_id: workspace_id,
          is_recycle: "false",
        },
      });
      const find_user_data = await User.findOne({
        where: {
          id: user_id,
        },
      });
      // const guest_data = await Guest.findAll({where: {
      //   is_approved1: "true",
      //   is_approved2 : "true"
      // }});
      const guest_data = await Guest.findAll();

      function addSharedInfo(object, sharedData) {
        const user_type = find_user_data.user_type;
        object.dataValues.user_type = user_type;
        const user_email = find_user_data.email;
        object.dataValues.user_email = user_email;

        const sharedInfo = {
          shared_by: [],
          share_with: [],
        };
        sharedData.forEach(async (data) => {
          let guest_approved = await Guest.findOne({where:{
            folder_id:data.folder_id
          },
          attributes: ["is_approved1", "is_approved2"],
        })
          if (data.folder_id === object.id) {
            sharedInfo.shared_by.push(data.shared_by);
            // sharedInfo.share_with.push(data.guest_email);
            if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "true") {
              sharedInfo.share_with.push(data.guest_email);
            } else if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "false") {
              sharedInfo.share_with.push("L1 has approved and L2 is pending");
            } else if (guest_approved.is_approved2 === "true" && guest_approved.is_approved1 ==="false") {
              sharedInfo.share_with.push("L2 has approved and L1 is pending ");
            } else {
              if (guest_approved.is_approved1 === "false") {
                sharedInfo.share_with.push("L1 is pending");
              } else if (guest_approved.is_approved1 === "denied") {
                sharedInfo.share_with.push("L1 has Declined");
              }
            
              if (guest_approved.is_approved2 === "false") {
                sharedInfo.share_with.push("L2 is pending");
              } else if (guest_approved.is_approved2 === "denied") {
                sharedInfo.share_with.push("L2 has Declined");
              }
            }

            object.dataValues.expiry_date = data.expiry_date;
          } else if (data.file_id === object.id) {
            sharedInfo.shared_by.push(data.shared_by);
            // sharedInfo.share_with.push(data.guest_email);
            if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "true") {
              sharedInfo.share_with.push(data.guest_email);
            } else if (guest_approved.is_approved1 === "true" && guest_approved.is_approved2 === "false") {
              sharedInfo.share_with.push("L1 has approved and L2 is pending");
            } else if (guest_approved.is_approved2 === "true" && guest_approved.is_approved1 ==="false") {
              sharedInfo.share_with.push("L2 has approved and L1 is pending ");
            } else {
              if (guest_approved.is_approved1 === "false") {
                sharedInfo.share_with.push("L1 is pending");
              } else if (guest_approved.is_approved1 === "denied") {
                sharedInfo.share_with.push("L1 has Declined");
              }
            
              if (guest_approved.is_approved2 === "false") {
                sharedInfo.share_with.push("L2 is pending");
              } else if (guest_approved.is_approved2 === "denied") {
                sharedInfo.share_with.push("L2 has Declined");
              }
            }   
            object.dataValues.expiry_date = data.expiry_date;
          }
        });
        // Assign the arrays to the object.dataValues
        object.dataValues.shared_by = sharedInfo.shared_by;
        object.dataValues.share_with = sharedInfo.share_with;
      }

      // Apply the function to folders
      folders.forEach((folder) => {
        addSharedInfo(folder, guest_data);
      });

      files.forEach((file) => {
        addSharedInfo(file, guest_data);
      });
      await FolderAndFilesSize(folders)
      return res.status(200).json({ folders, files });
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error retrieving folder names:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving folder names." });
  }
});
router.post("/filedata", middleware, async (req, res) => {
  // console.log(id,"id__id_dd")
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const file_id = req.body.filemongo_id;

    const filesCollection = conn.collection("fs.chunks");
    const file = await filesCollection.findOne({
      files_id: new ObjectId(file_id),
    });
    // console.log(file.data.buffer,"_____filesvds")
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    await FileUpload.findAll({
      where: {
        filemongo_id: file_id,
      },
      attributes: ["file_type", "user_id", "file_name"],
    })
      .then((files) => {
        const obj = {};
        if (files && files.length > 0) {
          // Extract data from the files array (assuming you want the first item)
          const fileData = files[0].dataValues;
          obj.newdata = fileData;
          const loggsfolder = loggs.create({
            user_id: email,
            category: "View",
            action: `View : ${fileData.file_name}`,
            timestamp: Date.now(),
            system_ip: "10.10.0.8",
          });
          obj.file_data = file.data.buffer;
        }
        return res.status(200).json(obj);
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ message: "An error occurred while retrieving file names." });
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving file names." });
  }
});
const RecycleBin = require("../models/recycle");
const Policy = require("../models/policies/policy");
router.post("/deletefile", middleware, async (req, res) => {
  // const recycle = req.body.recycle
  // const noofdays = req.body.noofdays
  const chunksCollection = conn.collection("fs.chunks");
  const filesCollection = conn.collection("fs.files");
  const id = req.body.id;
  let fileq = await FileUpload.findOne({
    where: {
      id: id,
    },
  });
  try {
    const token = req.header("Authorization");
    // console.log(token,"____deletetoken")
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const user_id = decodedToken.user.id;
    // console.log(email,")************************email")
    // const id = await User.findOne({where:{email:email}})
    // const user_id = id.id

    const folderdata = await Folder.findOne({ where: { id: id } });
    const file = req.body.file;
    const user_type = await User.findOne({
      where: {
        id: user_id,
      },
      attributes: ["user_type"],
    });

    async function deleteFolderAndFiles(folder) {
      // Find and update files in the current folder
      const files = await FileUpload.findAll({
        where: {
          is_recyclebin: "false",
          user_id: folder.user_id,
          folder_name: folder.folder_name,
        },
      });

      for (const file of files) {
        await file.update({ is_recyclebin: "true" });
      }

      // Find and process child folders
      const childFolders = await Folder.findAll({
        where: {
          is_recycle: "false",
          user_id: folder.user_id,
          parent_id: folder.id,
        },
      });

      for (const childFolder of childFolders) {
        await deleteFolderAndFiles(childFolder);
      }

      // Update the current folder
      await folder.update({ is_recycle: "true" });
    }

    if (user_type.user_type === "Admin") {
      if (file) {
        await FileUpload.update(
          // console.log("inside")
          { is_recyclebin: "true" },
          { where: { id: id } }
        );

        const loggsfolder = await loggs.create({
          user_id: email,
          category: "Delete",
          action: `File Moved to RecycelBin : ${fileq.file_name}`,
          timestamp: Date.now(),
          system_ip: "10.10.0.8",
        });
        return res.status(200).json({ message: "file delete Successfully" });
      } else {
        // Update the folder to mark it as "recycle"
        const [no_of_rows] = await Folder.update(
          { is_recycle: "true" },
          { where: { id: id } }
        );

        if (no_of_rows === 0) {
          return res.status(404).json({ message: "Folder not found" });
        }

        // Find the initial folder
        const initial_updatedFolder = await Folder.findOne({
          where: { id: id },
        });
        // Example usage:
        await deleteFolderAndFiles(initial_updatedFolder);
        const loggsfolder = await loggs.create({
          user_id: email,
          category: "Delete",
          action: `Folder Moved to RecycelBin : ${initial_updatedFolder.folder_name}`,
          timestamp: Date.now(),
          system_ip: "10.10.0.8",
        });
      }
      return res.status(200).json({ message: "folder deleted successfully" });
    } else {
      const recycle = await Policy.findOne({
        where: {
          selected_users: {
            [Op.contains]: [email],
          },
        },
      });

      const no_of_days = recycle.no_of_days;
      if (recycle) {
        try {
          if (file) {
            await FileUpload.update(
              // console.log("inside")
              { is_recyclebin: "true" },
              { where: { id: id } }
            );
            const loggsfolder = await loggs.create({
              user_id: email,
              category: "Delete",
              action: `File Moved to RecycelBin : ${fileq.file_name}`,
              timestamp: Date.now(),
              system_ip: "10.10.0.8",
            });
            return res
              .status(200)
              .json({ message: "file delete Successfully" });
          } else {
            const initial_updatedFolder = await Folder.findOne({
              where: { id: id },
            });
            await deleteFolderAndFiles(initial_updatedFolder);
            const loggsfolder = await loggs.create({
              user_id: email,
              category: "Delete",
              action: `Folder Moved to RecycelBin : ${initial_updatedFolder.folder_name}`,
              timestamp: Date.now(),
              system_ip: "10.10.0.8",
            });
            return res
              .status(200)
              .send({ message: " folder deleted Successfully" });
          }
        } catch (error) {
          return res.status(500).json({ message: "server error " });
        }
      } else {
        if (file) {
          fileq = await FileUpload.findOne({
            where: {
              id: id,
            },
          });
          const file_id = fileq.filemongo_id;

          const deletedChunks = await chunksCollection.deleteMany({
            files_id: new ObjectId(file_id),
          });
          const deletedFile = await filesCollection.deleteOne({
            _id: new ObjectId(file_id),
          });
          if (
            deletedChunks.deletedCount === 0 &&
            deletedFile.deletedCount === 0
          ) {
            return res.status(404).json({ message: "File not found" });
          }
          await FileUpload.destroy({
            where: {
              id: id,
            },
          }).then(async () => {
            const loggsfolder = await loggs.create({
              user_id: email,
              category: "Delete",
              action: `File Deleted : ${fileq.file_name}`,
              timestamp: Date.now(),
              system_ip: "10.10.0.8",
            });
            return res
              .status(200)
              .json({ message: "File Delete Successfully" });
          });
        } else {
          await folder
            .destroy({
              where: {
                id: id,
              },
            })
            .then(() => {
              folder
                .destroy({
                  where: {
                    parent_id: id,
                  },
                })
                .then(async () => {
                  const loggsfolder = await loggs.create({
                    user_id: email,
                    category: "Delete",
                    action: `Folder Deleted : ${folderdata.folder_name}`,
                    timestamp: Date.now(),
                    system_ip: "10.10.0.8",
                  });
                  return res
                    .status(200)
                    .json({ message: "Folder Delete Sucessfully" });
                });
            })
            .catch(() => {
              return res.status(500).json({ message: "server error" });
            });
        }
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "server error" });
  }
});

router.post("/getrecycle", middleware, async (req, res) => {
  const token = req.header("Authorization");
  const decodedToken = jwt.verify(token, "acmedms");
  const user_id = decodedToken.user.id;

  try {
    let data = [];
    const user_type = await User.findOne({
      where: {
        id: user_id,
      },
      attributes: ["user_type"],
    });

    function recycleData(recycle) {
      const idSet = new Set(recycle.map((item) => item.id));
      const result = [];

      for (let i = 0; i < recycle.length; i++) {
        const obj = recycle[i];

        if (!idSet.has(obj.parent_id)) {
          result.push(obj);
        }
      }

      return result;
    }

    if (user_type.user_type === "Admin") {
      let all_folder = await Folder.findAll({
        where: {
          is_recycle: "true",
        },
      });

      data = recycleData(all_folder);

      let fileCheck = await FileUpload.findAll({
        where: {
          is_recyclebin: "true",
        },
      });

      if (fileCheck.length > 0) {
        const folderNamesWithRecycle = new Set(
          all_folder.map((folder) => folder.folder_name)
        );

        for (let i = 0; i < fileCheck.length; i++) {
          const file = fileCheck[i];

          if (!folderNamesWithRecycle.has(file.folder_name)) {
            const correspondingFolder = all_folder.find(
              (folder) => folder.folder_name === file.folder_name
            );
            if (
              !correspondingFolder ||
              (correspondingFolder &&
                correspondingFolder.is_recycle === "false")
            ) {
              data.push(file);
            }
          }
        }
      }
    } else {
      let all_folder = await Folder.findAll({
        where: {
          is_recycle: "true",
          user_id: user_id,
        },
      });
      data = recycleData(all_folder);

      let fileCheck = await FileUpload.findAll({
        where: {
          is_recyclebin: "true",
          user_id: user_id,
        },
      });

      if (fileCheck.length > 0) {
        const folderNamesWithRecycle = new Set(
          all_folder.map((folder) => folder.folder_name)
        );

        for (let i = 0; i < fileCheck.length; i++) {
          const file = fileCheck[i];

          if (!folderNamesWithRecycle.has(file.folder_name)) {
            const correspondingFolder = all_folder.find(
              (folder) => folder.folder_name === file.folder_name
            );
            if (
              !correspondingFolder ||
              (correspondingFolder &&
                correspondingFolder.is_recycle === "false")
            ) {
              data.push(file);
            }
          }
        }
      }
    }
    return res.status(200).json({ message: "success", data });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/restore", async (req, res) => {
  const { folder_id, file_id } = req.body;
  const token = req.header("Authorization");
  const decodedToken = jwt.verify(token, "acmedms");
  const id = decodedToken.user.id;
  const email = decodedToken.user.username;
  try {
    if (file_id) {
      let fileRestore = await FileUpload.update(
        { is_recyclebin: "false" },
        { where: { is_recyclebin: "true", id: file_id } }
      );
      const loggsfolder = await loggs.create({
        user_id: email,
        category: "Restore",
        action: `File Restore : ${fileRestore.file_name}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });
      return res.status(200).json({ message: "file restore Successfully" });
    } else {
      const [no_of_rows] = await Folder.update(
        { is_recycle: "false" },
        { where: { id: folder_id } }
      );

      if (no_of_rows === 0) {
        return res.status(404).json({ message: "Folder not found" });
      }

      const initial_restoredFolder = await Folder.findOne({
        where: { id: folder_id },
      });

      async function restoreFolderAndFiles(folder) {
        const files = await FileUpload.findAll({
          where: {
            is_recyclebin: "true",
            user_id: folder.user_id,
            folder_name: folder.folder_name,
          },
        });

        for (const file of files) {
          await file.update({ is_recyclebin: "false" });
        }

        const childFolders = await Folder.findAll({
          where: {
            is_recycle: "true",
            user_id: folder.user_id,
            parent_id: folder.id,
          },
        });

        for (const childFolder of childFolders) {
          await restoreFolderAndFiles(childFolder);
        }

        await folder.update({ is_recycle: "false" });
      }

      await restoreFolderAndFiles(initial_restoredFolder);
      const loggsfolder = await loggs.create({
        user_id: email,
        category: "Restore",
        action: `Folder Restore : ${initial_restoredFolder.folder_name}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });

      return res.status(200).json({ message: "folder restore Successfully" });
    }
  } catch (error) {
    return res.status(500).json({ message: "server error" });
  }
});
// deleted restore

router.post("/deleterestore", middleware, async (req, res) => {
  const token = req.header("Authorization");
  // console.log(token,"____deletetoken")
  const decodedToken = jwt.verify(token, "acmedms");
  // const  user_id = 340;
  const file = req.body.file;
  const id = req.body.id;
  const user_id = decodedToken.user.id;
  const email = decodedToken.user.username;
  try {
    if (file) {
      const fileq = await FileUpload.findOne({
        where: {
          id: id,
        },
      });
      const file_id = fileq.filemongo_id;
      const deletedChunks = await chunksCollection.deleteMany({
        files_id: new ObjectId(file_id),
      });
      const deletedFile = await filesCollection.deleteOne({
        _id: new ObjectId(file_id),
      });
      if (deletedChunks.deletedCount === 0 && deletedFile.deletedCount === 0) {
        return res.status(404).json({ message: "File not found" });
      }
      await FileUpload.destroy({
        where: {
          id: id,
        },
      }).then(async () => {
        const loggsfolder = await loggs.create({
          user_id: email,
          category: "Delete",
          action: `File Deleted : ${fileq.file_name}`,
          timestamp: Date.now(),
          system_ip: "10.10.0.8",
        });
        return res.status(200).json({ message: "file delete Successfully" });
      });
    } else {
      const initial_delete_folder = await Folder.findOne({
        where: { id: id },
      });
      async function permananet_delete_folder_and_files(folder) {
        const files = await FileUpload.findAll({
          where: {
            is_recyclebin: "true",
            user_id: folder.user_id,
            folder_name: folder.folder_name,
          },
        });
        for (const file of files) {
          await file.destroy();
          let file_id = file.filemongo_id;
          const deletedFile = await filesCollection.deleteOne({
            _id: new ObjectId(file_id),
          });
          const logEntry = await loggs.create({
            user_id: email,
            category: "Delete",
            action: `File Deleted : ${file.file_name}`,
            timestamp: Date.now(),
            system_ip: "10.10.0.8",
          });
        }
        const child_folders = await Folder.findAll({
          where: {
            is_recycle: "true",
            user_id: folder.user_id,
            parent_id: folder.id,
          },
        });
        for (const childFolder of child_folders) {
          await permananet_delete_folder_and_files(childFolder);
        }
        await folder.destroy({ where: { id: id } });
      }
      await permananet_delete_folder_and_files(initial_delete_folder);
      await loggs.create({
        user_id: email,
        category: "Delete",
        action: `Folder Deleted : ${initial_delete_folder.folder_name}`,
        timestamp: Date.now(),
        system_ip: "10.10.0.8",
      });
      return res.status(200).json({ message: "folder deleted sucessfully" });
    }
  } catch (error) {
    return res.status.json({ message: "server error" });
  }
});

router.post("/metagetproperties", async (req, res) => {
  const file_name = req.body.file_name;
  const doctype = req.body.doctype;
  const Fields_Name = req.body.fieldnames;
  const modifiedFields = {};
  Object.keys(Fields_Name).forEach((key, index) => {
    modifiedFields["field" + (index + 1)] = Fields_Name[key];
  });
  try {
    // Check if the record already exists
    const existingRecord = await uploadfiledoctype.findOne({
      where: {
        file_name: file_name,
        doctype: doctype,
      },
    });

    if (existingRecord) {
      return res.status(401).json({
        message:
          "This doctype is already used with this file. Please try another doctype.",
      });
    }

    // Record doesn't exist, create or update it
    const uploaddocmetadata = await uploadfiledoctype.create({
      user_id: 3,
      doctype: doctype,
      file_name: file_name,
      field1: modifiedFields ? modifiedFields.field1 : null,
      field2: modifiedFields ? modifiedFields.field2 : null,
      field3: modifiedFields ? modifiedFields.field3 : null,
      field4: modifiedFields ? modifiedFields.field4 : null,
      field5: modifiedFields ? modifiedFields.field5 : null,
      field6: modifiedFields ? modifiedFields.field6 : null,
      field7: modifiedFields ? modifiedFields.field7 : null,
      field8: modifiedFields ? modifiedFields.field8 : null,
      field9: modifiedFields ? modifiedFields.field9 : null,
      field10: modifiedFields ? modifiedFields.field10 : null,
    });

    return res.status(200).json({
      message: "Properties updated successfully.",
      uploaddocmetadata: uploaddocmetadata[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while retrieving properties_names.",
    });
  }
});

const chunksCollection = conn.collection("fs.chunks");
const filesCollection = conn.collection("fs.files");
const rateLimit = require("express-rate-limit");
const { ThrottleGroup } = require("speed-limiter");
const throttle = new ThrottleGroup({ rate: 20 * 1024 * 1024 });

router.post("/downloadfile", middleware, async (req, res) => {
  try {
    const file_id = req.body.filemongo_id;
    // console.log(req.body, "___body");
    const token = req.header("Authorization");
    // console.log(token,"____token fileview")
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    // var conn = Mongoose.connection;
    // let fileId = "mongo id"          // mongo object_id

    // Require to create object_id
    // let ObjectID = require("bson-objectid");

    // javascript content-type utility
    let mime = require("mime-types");
    gfs = Grid(conn.db, mongoose.mongo);
    // let gfs = Grid(conn.db);
    // find file from fs.files collection
    let file = await gfs.files.findOne({ _id: new ObjectId(file_id) });

    if (!file) {
      return res.status(404).send("File not found");
    }

    let contentType = mime.contentType(file.filename);

    // gridfs connection
    const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);
    // Download stream data against fileId from fs.chunks collection
    const downloadStream = gridFSBucket.openDownloadStream(
      new ObjectId(file_id)
    );
    // const throttleStream = throttle.throttle(downloadStream); // Corrected
    // Download the file as per your framework syntax.
    // e.g for hapijs we can download like below
    const loggsfolder = await loggs.create({
      user_id: email,
      category: "Download",
      action: ` File Downloaded : ${file.filename}`,
      timestamp: Date.now(),
      system_ip: "10.10.0.8",
    });
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${file.filename}`,
    });
    // console.log( downloadStream.pipe(res,file),"____set")
    return downloadStream.pipe(res);
    // return throttleStream.pipe(res);
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

// router.post('/getdatar', async (req, res) => {
//   const file_id = req.body.id

//   const filesCollection = conn.collection('fs.chunks');
//   const file = await filesCollection.findOne({ files_id: new ObjectId(file_id) });
// console.log(file.data.buffer,"_____filesvds")
//   if (!file) {
//     return res.status(404).json({ message: 'File not found' });
//   }

//   // Send the binary data in the response
//   res.setHeader('Content-Type', file.contentType); // Set the content type of the response
//   res.send(file.data.buffer);
// });
const fs = require("fs");
// const path = require('path');

async function fetchFileContent(filemongo_id) {
  try {
    const filesCollection = conn.collection("fs.chunks");
    const file = await filesCollection.findOne({
      files_id: new ObjectId(filemongo_id),
    });

    if (!file || !file.data) {
      throw new Error(
        `File with ID ${filemongo_id} not found or missing data.`
      );
    }

    return file.data.buffer;
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw error;
  }
}

async function createFoldersRecursively(parentId, basePath = ".") {
  const folder = await Folder.findOne({ where: { id: parentId } });

  if (!folder) {
    return;
  }

  const folderPath = path.join(basePath, folder.folder_name);

  fs.mkdirSync(path.join(folderPath), { recursive: true });

  const subfolders = await Folder.findAll({ where: { parent_id: parentId } });

  for (const subfolder of subfolders) {
    await createFoldersRecursively(subfolder.id, folderPath);
  }

  const folderFiles = await FileUpload.findAll({
    where: {
      folder_name: folder.folder_name,
      workspace_name: folder.workspace_name,
    },
  });

  for (const file of folderFiles) {
    const filePath = path.join(
      folderPath,
      `file_${file.file_name}.${file.file_type}`
    );
    const fileContent = await fetchFileContent(file.filemongo_id);

    fs.writeFileSync(filePath, fileContent);
  }
}

router.post("/downloadfolders", async (req, res) => {
  const folder_id = req.body.folder_id;
  const Foldername = await Folder.findOne({ where: { id: folder_id } });
  try {
    await createFoldersRecursively(folder_id).then(() => {
      const folderToZip = path.join(
        "D:",
        "dms-clone",
        `${Foldername.folder_name}`
      );
      const zipFileName = "zipped-folder.zip";

      // Create a writable stream for the zip file
      const output = fs.createWriteStream(zipFileName);
      // console.log(output,"_____******************")
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Compression level (0 to 9)
      });
      // console.log(archive,"______archive")
      // Listen for archive warnings or errors
      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          console.warn("File not found:", err.path);
        } else {
          throw err;
        }
      });

      archive.on("error", (err) => {
        res.status(500).send({ error: "Failed to create the archive." });
      });
      archive.pipe(output);
      archive.directory(folderToZip, false);
      archive.finalize();
      output.on("close", () => {
        const zipFile = fs.readFileSync(zipFileName);
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${zipFileName}`
        );
        res.send(zipFile);
      });
    });

    //   res.status(200).json({ message: 'Folders and files created successfully.' });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// const express = require('express');
// const express = require('express');
// const fs = require('fs');
const zlib = require("zlib");
// const path = require('path');

// const express = require('express');
const archiver = require("archiver");
// const fs = require('fs');
// const path = require('path');

router.post("/compress", (req, res) => {
  const folderToZip = path.join("D:", "dms-clone", "new_created");
  const zipFileName = "zipped-folder.zip";

  // Create a writable stream for the zip file
  const output = fs.createWriteStream(zipFileName);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Compression level (0 to 9)
  });

  // Listen for archive warnings or errors
  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn("File not found:", err.path);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    res.status(500).send({ error: "Failed to create the archive." });
  });
  archive.pipe(output);
  archive.directory(folderToZip, false);
  archive.finalize();
  output.on("close", () => {
    res.download(zipFileName, (err) => {
      if (err) {
        res.status(500).send({ error: "Failed to send the zip file." });
      }

      // Delete the temporary zip file
      // fs.unlinkSync(zipFileName);
    });
  });
});

// const file_ide =  getmongoid

router.post("/cancelfileupload", async (req, res) => {
  try {
    // const id = getmongoid
    // console.log(id,"-diid")
    // const file_id = obj_id
    // // console.log(file_id,"______mongo id")
    // const deletedChunks = await chunksCollection.deleteMany({ files_id: new ObjectId(file_id) });
    // const deletedFile = await filesCollection.deleteOne({ _id: new ObjectId(file_id) });
    // if (deletedChunks.deletedCount === 0 && deletedFile.deletedCount === 0) {
    //   return res.status(404).json({ message: 'File not found' });
    // }
    setTimeout(() => {
      return res.status(200).json({ message: "File Upload canceled" });
    }, 3000);
  } catch (error) {
    return res.status(400).json({ message: "file cancelling error" });
  }
});

router.post("/sharedfile", middleware, async (req, res) => {
  try {
    // console.log(req.body, "___body");
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    // const email = "dasf@gmail.com"
    let mergedData = [];

    const guestData = await Guest.findAll({ where: { guest_email: email } });
    if (guestData.length > 0) {
      for (const item of guestData) {
        if (item.file_id) {
          // console.log(item.file_id,"_id")
          const files = await FileUpload.findAll({
            where: { id: item.file_id },
          });
          const filese = files[0].dataValues;
          // console.log(files[0].dataValues,"__files")
          mergedData.push({ ...item.dataValues, filese });
        }
      }
    }
    return res.status(200).json({ mergedData });
  } catch (error) {
    return res.status(500).json({ message: "error in sending shared files" });
  }
});

const cron = require("node-cron");
const nodemailer = require("nodemailer");

const sendDailyEmail = async (recipients) => {
  try {
    const events = await loggs.findAll({
      where: {
        category: ["Create", "Delete", "Shared", "Auth", "Upload"],
        timestamp: {
          [Op.gte]: Date.now() - 24 * 60 * 60 * 1000,
        },
      },
    });

    if (events.length === 0) {
      console.log("No events to notify");
      return;
    }
    let emailContent =
      '<table border="1" cellpadding="2" cellspacing="0" style="border-collapse: collapse;">' +
      "<tr>" +
      '<th style="background-color: #FFFFCC;">User</th>' +
      '<th style="background-color: #FFFFCC;">Action</th>' +
      '<th style="background-color: #FFFFCC;">Timestamp</th>' +
      "</tr>";

    for (const event of events) {
      const noTime = parseInt(event.timestamp, 10);

      if (!isNaN(noTime)) {
        const formattedTimestamp = new Date(noTime).toLocaleString();
        emailContent += `
      <tr>
      <td style="padding-left: 5px; padding-right: 5px; font-size: 12.6px;">${event.user_id}</td>
      <td style="padding-left: 5px; padding-right: 5px; font-size: 12.6px;">${event.action}</td>
      <td style="padding-left: 5px; padding-right: 5px; font-size: 12.6px;">${formattedTimestamp}</td>
      </tr>

      `;
      }
    }
    emailContent += "</table>";

    const transporter = nodemailer.createTransport({
      host: "10.10.0.100",
      port: 25,
      secure: false,
      auth: {
        user: "noreply.dochub@acmetelepower.in",
        pass: "Veer@1234!",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
<html>    
<p>Dear Admin,</p>
<p>The following changes have been made in the last 24 hours:</p>
<p>${emailContent}</p>
<p>Regards,</p>
<p>ACME DocHub</p>
</html>`;

    for (const recipient of recipients) {
      const mailOptions = {
        from: "ACME DocHub <noreply.dochub@acmetelepower.in>",
        to: recipient.email,
        // to: "logimetrix13@gmail.com",
        subject: "Daily Event Summary",
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Daily Email sent:", info.response);
    }
  } catch (error) {
    console.error("Error sending daily email:", error);
  }
};

async function fetchDataFromUserDatabase() {
  try {
    const data = await User.findAll({ where: { user_type: "Admin" } });
    sendDailyEmail(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
// Schedule the cron job to run daily at 8 PM

// cron.schedule("46 11 * * *", sendDailyEmail);

// cron.schedule("59 19 * * *", fetchDataFromUserDatabase);
cron.schedule("51 11 * * *", fetchDataFromUserDatabase);

module.exports = router;
