import https from 'https';

// Retrieve API key from command line arguments or environment variable
const apiKey = process.argv[2] || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('Please provide an API key as an argument or set VITE_GEMINI_API_KEY environment variable.');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(data);
                console.log('Available Models:');
                if (response.models) {
                    response.models.forEach((model) => {
                        // Filter for generateContent supported models
                        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`- ${model.name} (Version: ${model.version}, Display Name: ${model.displayName})`);
                        }
                    });
                } else {
                    console.log("No models found in response.");
                }
            } catch (e) {
                console.error('Error parsing JSON:', e.message);
            }
        } else {
            console.error(`API Request Failed with Status Code: ${res.statusCode}`);
            console.error('Response:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error making request:', err.message);
});
