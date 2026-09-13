import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Read .env.local if present
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('MONGODB_URI=')) {
          mongoUri = trimmed.replace('MONGODB_URI=', '').trim();
          // Remove quotes if present
          if (
            (mongoUri.startsWith('"') && mongoUri.endsWith('"')) ||
            (mongoUri.startsWith("'") && mongoUri.endsWith("'"))
          ) {
            mongoUri = mongoUri.slice(1, -1);
          }
          break;
        }
      }
    }
  } catch (e) {
    console.warn('Could not parse .env.local:', e);
  }
}

const MONGODB_URI = mongoUri || 'mongodb://127.0.0.1:27017/autoshop_license_db';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: 'admin@autoshop.com' });
  if (existing) {
    console.log('Super Admin already exists: admin@autoshop.com');
  } else {
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);
    await User.create({
      name: 'Super Admin',
      email: 'admin@autoshop.com',
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
    });
    console.log('Successfully created initial Super Admin:');
    console.log('Email:    admin@autoshop.com');
    console.log('Password: Admin@12345');
    console.log('Role:     super_admin');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
