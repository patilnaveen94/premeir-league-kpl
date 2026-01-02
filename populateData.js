import { populateTestData } from './src/utils/populateTestData.js';

const runSetup = async () => {
  try {
    console.log('Starting test data population...');
    await populateTestData();
    console.log('✅ Test data populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

runSetup();