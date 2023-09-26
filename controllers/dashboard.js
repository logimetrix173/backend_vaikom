const express = require("express");
const router = express.Router();
const middleware = require("../middleware/authorization");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const User = require("../models/add_user");
const Workspace = require("../models/add_workspace");
const Folder = require("../models/folder");
const Fileupload = require("../models/fileupload");
const guestsignup = require("../models/link_sharing/guestsignup");
router.post("/countworkspace", async (req, res) => {
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const user_id = decodedToken.user.id;
    // const user_id = 31
    // const userType = "User";
    // const email = "sunilrana@gmail.com";
    const Usert = await User.findOne({
      where: {
        email: email,
      },
    });
    const userType = Usert.user_type;
    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let workspaceCount = 0;
    let Teamspace = 1;
    let folders = 0;
    let files = 0;
    if (userType === "Admin") {
      // If the user is an admin, count all workspaces
      Teamspace = await Workspace.count({
        where: {
          workspace_type: "Teamspace",
        },
      });
      workspaceCount = await Workspace.count();
      folders = await Folder.count({ where: { levels: 0 } });
      files = await Fileupload.count();
    } else {
      files = await Fileupload.count({
        where: {
          user_id: user_id,
        },
      });

      folders = await Folder.count({
        where: {
          user_id: user_id,
          levels: 0,
        },
      });
      // If the user is not an admin, count workspaces associated with the user's email
      workspaceCount = await Workspace.count({
        where: {
          selected_users: {
            [Op.contains]: [email],
          },
        },
      });
    }

    res
      .status(200)
      .json({
        workspaceCount: workspaceCount,
        TeamSpace: Teamspace,
        folders: folders,
        files: files,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/latestfolderfiles", middleware, async (req, res) => {
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const user_id = decodedToken.user.id;
    //   const   email  = "sunilrana1730@gmail.com"
    //   const user_id = 31
    const Usert = await User.findOne({
      where: {
        email: email,
      },
    });
    const userType = Usert.user_type;

    let currentDate = Date.now();
    let startingDate = Math.floor(currentDate - 6 * 24 * 60 * 60 * 1000);
    let endingDate = Math.floor(currentDate);

    let latestFolders = [];
    let latestFiles = [];

    if (userType === "Admin") {
      const latestFiless = await Fileupload.findAll({
        where: {
          time_stamp: {
            [Op.between]: [startingDate, endingDate],
          },
        },
      });

      // Extract all user IDs from the latestFiles
      const userIds = latestFiless.map((file) => file.user_id);
      const guestIds = latestFiless.map((file) => file.guest_id);

      // Fetch all User emails corresponding to the user IDs
      const users = await User.findAll({
        attributes: ["id", "email"],
        where: {
          id: userIds,
        },
      });
      const guests = await guestsignup.findAll({
        where: { id: guestIds },
        attributes: ["id", "email"],
      });

      // Create a mapping of user IDs to emails for efficient lookup
      const userMap = users.reduce((map, user) => {
        map[user.id] = user.email;
        return map;
      }, {});
      const guestMap = guests.reduce((map, user) => {
        map[user.id] = user.email;
        return map;
      }, {});

      // Add email to each file in the latestFiles response
      latestFiles = latestFiless.map((file) => ({
        ...file.dataValues, // Preserve existing properties from file
        email: userMap[file.user_id] || guestMap[file.guest_id], // Add the email property
      }));

      //   console.log(responseWithEmails,"________________urecc"); // Updated response with email for each user_id

      const latestFolderss = await Folder.findAll({
        where: {
          levels: 0,
          time_stamp: {
            [Op.between]: [startingDate, endingDate],
          },
        },
      });

      const userIdsForFolders = latestFolderss.map((folder) => folder.user_id);

      const usersForFolders = await User.findAll({
        attributes: ["id", "email"],
        where: {
          id: userIdsForFolders,
        },
      });
     
      const userMapForFolders = usersForFolders.reduce((map, user) => {
        map[user.id] = user.email;
        return map;
      }, {});
      

      latestFolders = latestFolderss.map((folder) => ({
        ...folder.dataValues, // Preserve existing properties from folder
        email:
          userMapForFolders[folder.user_id]  // Add the email property
      }));
      //   console.log(responseWithFolderEmails); // Updated response with email for each user_id
    } else if (userType === "User") {
      latestFolders = await Folder.findAll({
        where: {
          levels: 0,
          user_id: user_id,
          time_stamp: {
            [Op.between]: [startingDate, endingDate],
          },
        },
      });

      latestFiles = await Fileupload.findAll({
        where: {
          user_id: user_id,
          time_stamp: {
            [Op.between]: [startingDate, endingDate],
          },
        },
      });
    }

    return res.json({
      latestFolders: latestFolders,
      latestFiles: latestFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/quotadetails", middleware, async (req, res) => {
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const user_id = decodedToken.user.id;
    //    const email  = "sunilrana@gmail.com"
    //    const user_id =31
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    const userType = user.user_type;

    if (userType === "Admin") {
      const allWorkspaces = await Workspace.findAll();

      let totalQuota = 0;
      let totalUsedQuota = 0;
      let allWorkspaceDetails = [];

      for (const workspace of allWorkspaces) {
        const filesInWorkspace = await Fileupload.findAll({
          where: {
            workspace_id: workspace.id,
          },
        });

        const workspaceQuota = parseInt(workspace.quota);

        let workspaceFileSize = 0;
        for (const file of filesInWorkspace) {
          workspaceFileSize += parseInt(file.file_size) / 1024;
        }

        totalQuota += workspaceQuota;
        totalUsedQuota += workspaceFileSize;

        allWorkspaceDetails.push({
          workspace_id: workspace.id,
          workspace_name: workspace.workspace_name,
          workspace_quota: workspaceQuota,
          used_quota: workspaceFileSize,
        });
      }

      const usersWithMaxQuota = await User.findAll({
        where: {
        //   user_type: "User",
        user_type: {
            [Op.or]: ["Admin", "User"],
          },
        },
      });

      const userList = [];

      for (const usr of usersWithMaxQuota) {
        const userFiles = await Fileupload.findAll({
          where: {
            user_id: usr.id,
          },
        });

        let userFileSize = 0;
        for (const file of userFiles) {
          userFileSize += parseInt(file.file_size);
        }

        userList.push({
          user_id: usr.id,
          user_email: usr.email,
          max_quota: usr.max_quota,
          used_quota: userFileSize / 1024,
        });
      }

      res.json({
        total_quota: totalQuota,
        total_used_quota: totalUsedQuota,
        workspaces: allWorkspaceDetails,
        user_list: userList,
      });
    } else if (userType === "User") {
      const workspaces = await Workspace.findAll({
        where: {
          selected_users: {
            [Op.contains]: [email],
          },
        },
      });

      let totalQuota = 0;
      let workspaceDetails = [];

      for (const workspace of workspaces) {
        const filesInWorkspace = await Fileupload.findAll({
          where: {
            user_id: user_id,
            workspace_id: workspace.id,
            user_type: {
              [Op.or]: ["Admin", "User"],
            },
          },
        });

        const workspaceQuota = workspace.quota;

        let workspaceFileSize = 0;
        for (const file of filesInWorkspace) {
          workspaceFileSize += parseInt(file.file_size);
        }

        totalQuota += workspaceFileSize;

        workspaceDetails.push({
          workspace_id: workspace.id,
          workspace_name: workspace.workspace_name,
          workspace_quota: workspaceQuota,
          used_quota: workspaceFileSize / 1024,
        });
      }

      const usersWithMaxQuota = await User.findAll({
        where: {
          email: email,
          user_type: "User",
        },
      });

      const userList = [];

      for (const usr of usersWithMaxQuota) {
        const userFiles = await Fileupload.findAll({
          where: {
            user_id: usr.id,
          },
        });

        let userFileSize = 0;
        for (const file of userFiles) {
          userFileSize += parseInt(file.file_size) / 1024;
        }

        userList.push({
          user_id: usr.id,
          user_email: usr.email,
          max_quota: usr.max_quota,
          used_quota: userFileSize,
          user_percentage: (userFileSize / usr.max_quota) * 100,
        });
      }

      res.json({
        total_quota: totalQuota,
        workspaces: workspaceDetails,
        user_list: userList,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/countextension", middleware, async (req, res) => {
  try {
    const token = req.header("Authorization");
    const decodedToken = jwt.verify(token, "acmedms");
    const email = decodedToken.user.username;
    const user_id = decodedToken.user.id;
    //    const email = "sunilrana@gmail.com"
    //    const user_id  = 31
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    const userType = user.user_type;

    if (userType === "Admin") {
      // For Admin: Find all file extensions and their counts
      const allFiles = await Fileupload.findAll();

      const extensionCount = {};

      for (const file of allFiles) {
        const extension = file.file_type.toLowerCase();

        if (extensionCount.hasOwnProperty(extension)) {
          extensionCount[extension]++;
        } else {
          extensionCount[extension] = 1;
        }
      }

      res.json(extensionCount);
    } else {
      // For User: Find file extensions and their counts for the user
      const userFiles = await Fileupload.findAll({
        where: {
          user_id: user_id,
        },
      });

      const userExtensionCount = {};

      for (const file of userFiles) {
        const extension = file.file_type.toLowerCase();

        if (userExtensionCount.hasOwnProperty(extension)) {
          userExtensionCount[extension]++;
        } else {
          userExtensionCount[extension] = 1;
        }
      }

      res.json(userExtensionCount);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// API endpoint for searching files
router.post("/search", async (req, res) => {
  const searchTerm = req.query.q;
  const workspace = req.body.workspace.label;
  const extension = req.body.extension;
  // Search query parameter
  const token = req.header("Authorization");
  const decodedToken = jwt.verify(token, "acmedms");
  const email = decodedToken.user.username;
  const user_id = decodedToken.user.id;
  const user = await User.findOne({
    where: {
      email: email,
    },
  });
  const userType = user.user_type;
  let workspaceResults = {};
  try {
    // Define the base query
    const baseQuery = {
      where: {},
    };
    if (userType !== "Admin") {
      baseQuery.where.user_id = user_id;
    }

    // Add conditions to the query based on provided parameters
    if (workspace) {
      baseQuery.where.workspace_name = {
        [Op.iLike]: `%${workspace}%`,
      };
    }

    if (extension) {
      baseQuery.where.file_type = {
        [Op.iLike]: `%${extension}%`,
      };
    }

    if (searchTerm) {
      baseQuery.where.file_name = {
        [Op.iLike]: `%${searchTerm}%`,
      };
    }
    let results = {};
    if (userType !== "Admin") {
      results = await Fileupload.findAll(baseQuery);
      // console.log(results,"______results")
    } else {
      results = await Fileupload.findAll(baseQuery);
      if (results.length === 0) {
        return res.status(404).json({ message: "No search found" });
      }
    }
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
