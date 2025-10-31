import { StreamClient } from '@stream-io/node-sdk';

async function testGetStream() {
    console.log('=== GetStream API Test ===\n');
    
    const apiKey = 'qe6ra2u6tnea';
    const apiSecret = 'n65g8wsncmzq2v6gevd4rgcpaktmh7fc2ery3z3jphr2s52zj7htk976utm9h5hh';
    
    console.log('API Key:', apiKey);
    console.log('API Secret:', apiSecret ? apiSecret.substring(0, 20) + '...' : 'NOT SET');
    console.log('API Key Length:', apiKey?.length);
    console.log('API Secret Length:', apiSecret?.length);
    console.log('');
    
    if (!apiKey || !apiSecret) {
        console.error('❌ API credentials not set in environment');
        return;
    }
    
    try {
        console.log('1. Initializing StreamClient...');
        const client = new StreamClient(apiKey, apiSecret);
        console.log('✅ StreamClient initialized\n');
        
        console.log('2. Testing user upsert...');
        const testUsers = [
            {
                id: 'test-user-' + Date.now(),
                name: 'Test User',
                role: 'user'
            }
        ];
        
        const upsertResult = await client.upsertUsers(testUsers);
        console.log('✅ User upsert successful');
        console.log('Result:', JSON.stringify(upsertResult, null, 2));
        console.log('');
        
        console.log('3. Creating a test call...');
        const callId = 'test-call-' + Date.now();
        const call = client.video.call('default', callId);
        
        const callData = {
            created_by_id: testUsers[0].id,
            members: [
                {
                    user_id: testUsers[0].id,
                    role: 'user'
                }
            ]
        };
        
        const callResponse = await call.create({ data: callData });
        console.log('✅ Call created successfully');
        console.log('Call ID:', callResponse.call.id);
        console.log('Call CID:', callResponse.call.cid);
        console.log('');
        
        console.log('=== All Tests Passed ✅ ===');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        console.error('\nFull error:', error);
    }
}

testGetStream();
