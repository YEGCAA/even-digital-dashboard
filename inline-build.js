
import fs from 'fs';
import path from 'path';

const distDir = './dist';
const assetsDir = path.join(distDir, 'assets');
const htmlPath = path.join(distDir, 'index.html');
const outputPath = './DASHBOARD_COMPLETO/index_standalone.html';

let html = fs.readFileSync(htmlPath, 'utf8');

// Read CSS
const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
cssFiles.forEach(file => {
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
    const tag = `<link rel="stylesheet" crossorigin href="./assets/${file}">`;
    const tag2 = `<link rel="stylesheet" crossorigin href="/assets/${file}">`;
    const tag3 = `<link rel="stylesheet" href="/index.css">`; // Check for this too

    html = html.replace(tag, `<style>${content}</style>`);
    html = html.replace(tag2, `<style>${content}</style>`);
    html = html.replace(tag3, `<style>${content}</style>`);
});

// Read JS
const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
jsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
    // Find the script tag and replace it
    const regex = new RegExp(`<script type="module" crossorigin src=".*${file}"></script>`, 'g');
    html = html.replace(regex, `<script>${content}</script>`);
});

// Clean up any remaining module/crossorigin bits if needed, although the regex should handle it
html = html.replace(/type="module"/g, '');

fs.writeFileSync(outputPath, html);
console.log('Successfully created standalone HTML at:', outputPath);
