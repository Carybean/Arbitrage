const fs = require('fs-extra');
const { execSync } = require('child_process');
const glob = require('glob');
const chokidar = require('chokidar');

// --- Helper functions for each task ---
const processJS = (file) => {
    const fileName = file.split(/[\\/]/).pop();
    console.log(`[JS] Processing: ${fileName}`);
    execSync(`terser "${file}" -o "dist/js/${fileName}" --compress --mangle`);
    execSync(`javascript-obfuscator "dist/js/${fileName}" --output "dist/js/${fileName}"`);
};

const processCSS = (file) => {
    const fileName = file.split(/[\\/]/).pop();
    console.log(`[CSS] Minifying: ${fileName}`);
    execSync(`cleancss "${file}" -o "dist/css/${fileName}"`);
};

const processHTML = (file) => {
    const fileName = file.split(/[\\/]/).pop();
    console.log(`[HTML] Minifying and Fixing Paths: ${fileName}`);
    
    // 1. Read the file content
    let content = fs.readFileSync(file, 'utf8');

    // 2. Automatically fix paths: change ../css/ to css/, etc.
    // This allows your src files to work nested, but dist files to work flat.
    content = content.replace(/\.\.\/css\//g, 'css/')
                     .replace(/\.\.\/js\//g, 'js/')
                     .replace(/\.\.\/assets\//g, 'assets/');

    // 3. Save the temporary "fixed" content so the minifier can grab it
    const tempPath = `dist/temp_${fileName}`;
    fs.writeFileSync(tempPath, content);

    // 4. Run the minifier on the fixed content
    execSync(`npx html-minifier-cli "${tempPath}" -o "dist/${fileName}" --collapse-whitespace --remove-comments`);

    // 5. Clean up the temporary file
    fs.removeSync(tempPath);
};

// --- The main build function ---
async function runBuild() {
    console.log("🚀 Cleaning dist folder...");
    fs.removeSync('dist');
    ['dist/js', 'dist/css', 'dist/assets'].forEach(dir => fs.ensureDirSync(dir));

    console.log("📦 Processing files...");
    glob.sync('src/js/*.js').forEach(processJS);
    glob.sync('src/css/*.css').forEach(processCSS);
    glob.sync('src/html/*.html').forEach(processHTML);
    
    console.log("📂 Copying assets...");
    fs.copySync('src/assets', 'dist/assets');
    if (fs.existsSync('CNAME')) fs.copySync('CNAME', 'dist/CNAME');
    if (fs.existsSync('sitemap.xml')) fs.copySync('sitemap.xml', 'dist/sitemap.xml');
    if (fs.existsSync('robots.txt')) fs.copySync('robots.txt', 'dist/robots.txt');
    
    console.log("✅ Build complete!");
}

// Check if we are in watch mode or just building once
if (process.argv.includes('--watch')) {
    runBuild().then(() => {
        console.log("👀 Watching for changes in src/...");
        chokidar.watch('src/**/*').on('change', (path) => {
            console.log(`\n📄 Change detected: ${path}`);
            if (path.endsWith('.js')) processJS(path);
            else if (path.endsWith('.css')) processCSS(path);
            else if (path.endsWith('.html')) processHTML(path);
            else if (path.startsWith('src/assets')) fs.copySync('src/assets', 'dist/assets');
        });
    });
} else {
    runBuild();
}