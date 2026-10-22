import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Loaded from .env / .env.local by `npm run seed`
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoshop_license_db';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@autoshop.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD is not set. Add it to .env.local or the environment, e.g.');
    console.error('  ADMIN_PASSWORD="choose-a-strong-password" npm run seed');
    process.exit(1);
  }

  console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    status: String,
    isActive: Boolean,
    createdAt: { type: Date, default: Date.now },
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Super Admin already exists: ${ADMIN_EMAIL}`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: 'Super Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      isActive: true,
    });
    console.log('Successfully created initial Super Admin:');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log('Password: (value of ADMIN_PASSWORD)');
    console.log('Role:     super_admin');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
