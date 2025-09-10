// Development server configuration for local development
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Import main server logic
import('./index.js').then(({ default: mainApp }) => {
  const PORT = process.env.PORT || 5001;
  
  // Use main app logic
  app.use(mainApp);
  
  // Serve static files in development
  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(publicPath)) {
    app.use('/uploads', express.static(join(publicPath, 'uploads')));
    app.use('/assets', express.static(join(publicPath, 'assets')));
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Development server running on http://localhost:${PORT}`);
    console.log(`📁 Static files served from: ${publicPath}`);
  });
}).catch(error => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});
