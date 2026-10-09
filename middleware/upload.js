// middlewares/upload.js

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'public/documents');
    },

    filename: (req, file, cb) => {
        // Save original file name
        cb(null, file.originalname);
    }

});

const fileFilter = (req, file, cb) => {

    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExtensions = [
        // Documents
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',

        // Images
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp'
    ];

    if (!allowedExtensions.includes(ext)) {
        return cb(
            new Error(
                'Only PDF, Word, Excel, and image files are allowed!'
            ),
            false
        );
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;





// const multer = require('multer');
// const path = require('path');

// // Configure storage for uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/documents');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname).toLowerCase();
//     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//   }
// });

// // File filter for allowed types
// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();

//   const allowedExts = [
//     '.pdf', '.doc', '.docx', '.xls', '.xlsx', // documents
//     '.png', '.jpg', '.jpeg'                   // images
//   ];

//   if (!allowedExts.includes(ext)) {
//     return cb(
//       new Error('Only PDF, Word, Excel, and Image files (PNG, JPG, JPEG) are allowed!'),
//       false
//     );
//   }

//   cb(null, true);
// };

// // Multer configuration
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
// });

// module.exports = upload;


