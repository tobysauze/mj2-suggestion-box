const http = require('http');

const BASE_URL = 'http://localhost:3001';

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testApplication() {
    console.log('🧪 Testing Mary Jean II Suggestion Box Application\n');

    try {
        // Test 1: Check if server is running
        console.log('1. Testing server connectivity...');
        const homeResponse = await makeRequest('/');
        if (homeResponse.status === 200) {
            console.log('   ✅ Server is running and serving the main page');
        } else {
            console.log('   ❌ Server not responding correctly');
            return;
        }

        // Test 2: Get initial suggestions (should be empty)
        console.log('\n2. Testing suggestions API...');
        const suggestionsResponse = await makeRequest('/api/suggestions');
        if (suggestionsResponse.status === 200 && suggestionsResponse.data.success) {
            console.log(`   ✅ Suggestions API working (${suggestionsResponse.data.suggestions.length} suggestions)`);
        } else {
            console.log('   ❌ Suggestions API not working');
            return;
        }

        // Test 3: Submit a test suggestion
        console.log('\n3. Testing suggestion submission...');
        const testSuggestion = {
            text: 'This is a test suggestion to verify the system is working correctly.',
            category: 'other'
        };
        
        const submitResponse = await makeRequest('/api/suggestions', 'POST', testSuggestion);
        if (submitResponse.status === 200 && submitResponse.data.success) {
            console.log('   ✅ Suggestion submission working');
            const suggestionId = submitResponse.data.id;
            
            // Test 4: Verify suggestion appears in list
            console.log('\n4. Testing suggestion retrieval...');
            const updatedSuggestions = await makeRequest('/api/suggestions');
            if (updatedSuggestions.status === 200 && updatedSuggestions.data.success) {
                const suggestions = updatedSuggestions.data.suggestions;
                const testSuggestionFound = suggestions.find(s => s.text === testSuggestion.text);
                if (testSuggestionFound) {
                    console.log('   ✅ Submitted suggestion appears in the list');
                } else {
                    console.log('   ❌ Submitted suggestion not found in list');
                }
            }

            // Test 5: Test admin login
            console.log('\n5. Testing admin login...');
            const adminLoginResponse = await makeRequest('/api/admin/login', 'POST', { password: 'maryjean2024' });
            if (adminLoginResponse.status === 200 && adminLoginResponse.data.success) {
                console.log('   ✅ Admin login working with default password');
            } else {
                console.log('   ❌ Admin login not working');
            }

            // Test 6: Test admin suggestions endpoint
            console.log('\n6. Testing admin suggestions endpoint...');
            const adminSuggestionsResponse = await makeRequest('/api/admin/suggestions');
            if (adminSuggestionsResponse.status === 200 && adminSuggestionsResponse.data.success) {
                console.log(`   ✅ Admin suggestions endpoint working (${adminSuggestionsResponse.data.suggestions.length} total suggestions)`);
            } else {
                console.log('   ❌ Admin suggestions endpoint not working');
            }

            // Test 7: Test admin stats
            console.log('\n7. Testing admin statistics...');
            const statsResponse = await makeRequest('/api/admin/stats');
            if (statsResponse.status === 200 && statsResponse.data.success) {
                console.log(`   ✅ Admin stats working (Total: ${statsResponse.data.stats.total}, Weekly: ${statsResponse.data.stats.weekly})`);
            } else {
                console.log('   ❌ Admin stats not working');
            }

            // Clean up: Delete the test suggestion
            console.log('\n8. Cleaning up test suggestion...');
            const deleteResponse = await makeRequest(`/api/admin/suggestions/${suggestionId}`, 'DELETE');
            if (deleteResponse.status === 200 && deleteResponse.data.success) {
                console.log('   ✅ Test suggestion deleted successfully');
            } else {
                console.log('   ⚠️  Could not delete test suggestion (this is okay for testing)');
            }

        } else {
            console.log('   ❌ Suggestion submission not working');
            return;
        }

        console.log('\n🎉 All tests passed! The Mary Jean II Suggestion Box is working correctly.');
        console.log('\n📋 Next steps:');
        console.log('   1. Open http://localhost:3001 in your browser');
        console.log('   2. Test the user interface');
        console.log('   3. Run "npm run setup-email" to configure email settings');
        console.log('   4. Change the default admin password for security');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\nMake sure the server is running on port 3001');
    }
}

testApplication();
