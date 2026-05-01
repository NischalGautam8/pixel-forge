import dotenv from 'dotenv';
dotenv.config();

console.log('Orchestrator starting...');

// Import the queue and worker so they execute
import './queues/imageQueue';

console.log('Orchestrator is running and listening for jobs on BullMQ...');

