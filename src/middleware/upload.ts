import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage(); 

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {

  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50') * 1024 * 1024 
  }
});