const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const sharp = require('sharp');


const app = express();
const upload = multer();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
const PORT = 3010;

cloudinary.config({
    cloud_name: 'djyecrmtf',
    api_key: '442232816552565',
    api_secret: '0VOXIfUl_SAlKi6j9gJ9seRDpj4'
});

const sizes = [
  { width: 100, height: 100 },
  { width: 200, height: 200 },
  { width: 300, height: 300 },
  { width: 400, height: 400 }
];

mongoose.connect('mongodb://localhost:27017/Database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('Error connecting to MongoDB:', err));

const ImageSchema = new mongoose.Schema({
  imageUrls: [String]
});

const ImageModel = mongoose.model('Image', ImageSchema, 'images');

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadPromises = sizes.map(size => {
      return new Promise((resolve, reject) => {
        sharp(file.buffer) 
          .resize(size.width, size.height)
          .toBuffer()
          .then(buffer => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.url);
              }
            }).end(buffer);
          })
          .catch(error => {
            reject(error);
          });
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    const data = new ImageModel({ imageUrls: uploadedUrls });
    const savedData = await data.save();

    res.json({ imageUrls: uploadedUrls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/', (req, resp) => {
    return resp.redirect('index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
