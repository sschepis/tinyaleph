#!/usr/bin/env node
/**
 * Test script for Google Vertex AI integration
 */

const { VertexAIClient } = require('./lib/vertex-ai');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Testing Google Vertex AI Integration...\n');
    
    // Load credentials
    const credsPath = path.join(__dirname, 'google.json');
    if (!fs.existsSync(credsPath)) {
        console.error('Error: google.json not found at', credsPath);
        process.exit(1);
    }
    
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
    console.log('Credentials loaded:');
    console.log('  Project ID:', creds.project_id);
    console.log('  Client Email:', creds.client_email?.substring(0, 30) + '...');
    
    // Create Vertex AI client
    const client = new VertexAIClient({
        projectId: creds.project_id,
        location: 'us-central1',
        model: 'gemini-2.0-flash-001',
        credentialsPath: credsPath
    });
    
    console.log('\nClient created:');
    console.log('  Model:', client.model);
    console.log('  Location:', client.location);
    console.log('  Project:', client.projectId);
    
    // Test authentication
    console.log('\nTesting authentication...');
    try {
        const connected = await client.isConnected();
        console.log('  Connected:', connected);
    } catch (e) {
        console.error('  Connection error:', e.message);
    }
    
    // Test simple completion
    console.log('\nTesting simple completion...');
    try {
        const response = await client.complete('Say hello in exactly 3 words.');
        console.log('  Response:', response);
    } catch (e) {
        console.error('  Completion error:', e.message);
        if (e.details) console.error('  Details:', e.details);
    }
    
    // Test chat
    console.log('\nTesting chat...');
    try {
        const messages = [
            { role: 'system', content: 'You are a helpful assistant that gives brief responses.' },
            { role: 'user', content: 'What is 2 + 2?' }
        ];
        const response = await client.chat(messages);
        console.log('  Response:', response.content);
        console.log('  Finish reason:', response.finishReason);
    } catch (e) {
        console.error('  Chat error:', e.message);
        if (e.details) console.error('  Details:', e.details);
    }
    
    // Test streaming
    console.log('\nTesting streaming...');
    try {
        const messages = [
            { role: 'user', content: 'Count from 1 to 5, one number per line.' }
        ];
        let output = '';
        for await (const chunk of client.streamChat(messages)) {
            if (typeof chunk === 'string') {
                output += chunk;
                process.stdout.write(chunk);
            }
        }
        console.log('\n  Total output length:', output.length);
    } catch (e) {
        console.error('  Streaming error:', e.message);
        if (e.details) console.error('  Details:', e.details);
    }
    
    console.log('\nTest complete!');
}

main().catch(console.error);