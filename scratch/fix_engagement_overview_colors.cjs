const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'engagement', 'AdminEngagementOverview.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of text-white with text-foreground (except any that are explicitly correct for other elements, but they all should be text-foreground)
content = content.replace(/className="([^"]*)text-white([^"]*)"/g, (match, prefix, suffix) => {
    // Only replace if it's text-white, not text-white/x
    if (!suffix.startsWith('/') && !suffix.startsWith('[')) {
        return `className="${prefix}text-foreground${suffix}"`;
    }
    return match;
});

// Also handle single-quoted or unquoted text-white if any, but JSX uses double quotes for classNames
// Let's replace the borders
content = content.replaceAll('border-white/10', 'border-border');
content = content.replaceAll('border-white/[0.05]', 'border-border/50');
content = content.replaceAll('bg-white/[0.01]', 'bg-muted/5');
content = content.replaceAll('bg-white/[0.02]', 'bg-muted/10');
content = content.replaceAll('bg-white/[0.03]', 'bg-muted/20');
content = content.replaceAll('bg-white/[0.04]', 'bg-muted/30');
content = content.replaceAll('bg-white/[0.05]', 'bg-muted/40');
content = content.replaceAll('hover:bg-white/[0.02]', 'hover:bg-muted/10');
content = content.replaceAll('hover:bg-white/[0.05]', 'hover:bg-muted/30');

// Save the changes
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminEngagementOverview.jsx to be theme-aware.');
