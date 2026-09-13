import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const ATLAS_URI = 'mongodb+srv://acehidan:123456ace@autoshopcrm.4swoana.mongodb.net/?retryWrites=true&w=majority';

async function run() {
  console.log('Connecting to Atlas Cluster...');
  const conn = await mongoose.createConnection(ATLAS_URI).asPromise();

  const sourceDb = conn.useDb('test');
  const targetDb = conn.useDb('prod');

  const contracts = await sourceDb.collection('contracts').find({}).toArray();
  console.log(`Found ${contracts.length} contracts in 'test' database.`);

  let inserted = 0;
  let updated = 0;

  for (const c of contracts) {
    const shopName = (c.businessName || c.shopName || 'AutoShop Client').toString().trim();
    const ownerName = (c.fullName || c.ownerName || 'Shop Owner').toString().trim();
    const phone = (c.phoneNumber || c.phone || 'N/A').toString().trim();
    const notes = `Online Plan: ${c.plan || 'basic'} | Status: ${c.status || 'pending'}`;

    const existing = await targetDb.collection('clients').findOne({
      $or: [{ phone }, { shopName }]
    });

    if (existing) {
      await targetDb.collection('clients').updateOne(
        { _id: existing._id },
        {
          $set: {
            shopName,
            ownerName,
            phone,
            notes,
            source: 'migrated',
            updatedAt: new Date(),
          }
        }
      );
      updated++;
    } else {
      await targetDb.collection('clients').insertOne({
        shopName,
        ownerName,
        phone,
        email: '',
        address: '',
        notes,
        source: 'migrated',
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: new Date(),
      });
      inserted++;
    }
  }

  console.log(`Migration Complete: ${inserted} inserted, ${updated} updated.`);
  await conn.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
