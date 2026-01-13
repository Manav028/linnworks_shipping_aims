import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { testConnection } from './database/connection';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use('/api', routes);

app.use(errorHandler);

const startServer = async () => {
  try {
    
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════');
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database connected`);
      console.log('═══════════════════════════════════════\n');
      console.log('Available endpoints:');
      console.log(`  POST /api/Setup/AddNewUser`);
      console.log(`  POST /api/Setup/UserConfig`);
      console.log(`  POST /api/Setup/UpdateConfig`);
      console.log(`  POST /api/Setup/ConfigDelete`);
      console.log(`  GET  /api/Setup/UserAvailableServices`);
      console.log(`  POST  /api/PrepaidLabel/UploadBulkLabels`);
      console.log(`  GET  /api/PrepaidLabel/ProcessingStatus/:bulkUploadId`);
      console.log(`  GET  /api/PrepaidLabel/PoolStatus`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();