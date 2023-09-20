// app.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const Grid = require('gridfs-stream');
const {GridFsStorage} = require('multer-gridfs-storage');
const bodyParser = require('body-parser');

const router = express.Router();

// Middleware
router.use(bodyParser.json());
const url = "mongodb://admin:dms1234@10.10.0.60:27017/admin"
// Connect to MongoDB
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Create GridFS stream for file operations
const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Set up Multer storage engine using GridFS
const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
      return {
        filename: file.originalname,
        metadata: {
        file_name: file.originalname,
        file_type:file.mimetype,
        file_size:file.size,
    levels: req.body.levels,
        file_size:req.body.file_size,
         file_type:req.bodyfile_type,
          folder_name:req.body.folder_name,
          workspace_name:req.body.workspace_name,
           doctype:req.body.doctype,
            parent_id:req.body.parent_id,
             fileDesc :req.body.fileDesc,
             workspace_type:req.body.workspace_name,
             policies_id:req.body.policies_id
             
          }
      };
    },
  });

const upload = multer({ storage });

// Routes for file upload
router.post('/upload', upload.any(), (req, res) => {

 try {
  return  res.status(200).json({ message: 'File uploaded successfully.' });
 } catch (error) {
    
 }
 
});

router.get('/filesdata', async(req, res) => {
    const filesCollection = conn.collection('fs.files');
    const allFiles = await filesCollection.find({}).toArray();
      if (!allFiles || allFiles.length === 0) {
        return res.status(404).json({ message: 'No files found' });
      }
    //   const fileNames = files.map((file) => file.filename);
      return res.status(200).json(allFiles);
    });
module.exports = router
