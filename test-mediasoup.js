// Simple MediaSoup test
console.log('Testing MediaSoup...');

try {
    import('mediasoup').then(async (mediasoup) => {
        console.log('✅ MediaSoup loaded successfully');
        console.log('MediaSoup version:', mediasoup.version);
        
        // Try to create a worker
        try {
            const worker = await mediasoup.createWorker({
                logLevel: 'warn',
                rtcMinPort: 10000,
                rtcMaxPort: 10999,
            });
            console.log('✅ MediaSoup worker created successfully');
            console.log('Worker PID:', worker.pid);
            worker.close();
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to create MediaSoup worker:', error);
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Failed to load MediaSoup:', error);
        process.exit(1);
    });
} catch (error) {
    console.error('❌ Failed to import MediaSoup:', error);
    process.exit(1);
}
