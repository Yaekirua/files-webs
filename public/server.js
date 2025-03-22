const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Basic configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));  // Serve static files (CSS, JS)

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);  // Create folder if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Unique filename
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },  // 50MB file size limit
  fileFilter: (req, file, cb) => {         // Allow all file types
    cb(null, true);
  }
});

// Password for admin access
const ADMIN_PASSWORD = 'admin123';  // Change this to a secure password

// Middleware to check admin password
const authenticateAdmin = (req, res, next) => {
  const { password } = req.query;
  if (password === ADMIN_PASSWORD) {
    next();  // Authorized
  } else {
    res.status(401).send('Unauthorized: Incorrect password');
  }
};

// Routes
app.get('/', (req, res) => {
  res.redirect('/client');  // Redirect root to client page
});

app.get('/admin', authenticateAdmin, (req, res) => {
  res.render('admin');  // Render the admin upload page
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).render('admin', { error: 'No file uploaded' });
  res.redirect('/admin?password=' + ADMIN_PASSWORD);
});

app.get('/client', (req, res) => {
  const GITHUB_PAGES_URL = 'https://your_username.github.io/your_repo/'; // Replace with your GitHub Pages URL
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).send('Error reading files');
    const fileLinks = files.map(file => ({
      name: file,
      url: `${GITHUB_PAGES_URL}${file}`,
    }));
    res.render('client', { fileLinks });  // Pass file links to client view
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});