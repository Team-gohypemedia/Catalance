import os
import re

# Define the directory to search
src_dir = r"d:\Catalance\Catalance\src\components\Forms"

# Define the replacements mapping
replacements = {
    # Text colors
    r'text-white/42': 'text-muted-foreground',
    r'text-white/45': 'text-muted-foreground',
    r'text-white/50': 'text-muted-foreground',
    r'text-white/55': 'text-muted-foreground',
    r'text-white/58': 'text-muted-foreground',
    r'text-white/68': 'text-muted-foreground',
    r'text-white/72': 'text-muted-foreground',
    r'text-white(?!\/)': 'text-foreground',
    r'text-red-400': 'text-destructive',
    
    # Backgrounds
    r'bg-\[\#101010\]/90': 'bg-card',
    r'bg-\[\#121212\]': 'bg-card',
    r'bg-white/5': 'bg-muted',
    r'bg-white/\[0\.03\]': 'bg-card',
    r'bg-white/\[0\.06\]': 'bg-accent',
    r'bg-white/12': 'bg-border',
    r'hover:bg-white/\[0\.06\]': 'hover:bg-accent hover:text-accent-foreground',
    
    # Borders
    r'border-white/10': 'border-border',
    r'border-white/12': 'border-border',
    r'border-white/15': 'border-border',
    
    # Specific attributes
    r'data-\[highlighted\]:bg-white/5': 'data-[highlighted]:bg-accent',
    r'data-\[highlighted\]:text-white': 'data-[highlighted]:text-accent-foreground',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            content = f.read()
        except UnicodeDecodeError:
            return False
    
    new_content = content
    for pattern, subst in replacements.items():
        new_content = re.sub(pattern, subst, new_content)
        
    # Extra fix for apple logo color (if it's hardcoded to text-white)
    new_content = new_content.replace('AppleLogo className="size-[18px] text-white"', 'AppleLogo className="size-[18px] text-foreground"')
    new_content = new_content.replace('AppleLogo className="size-5 text-white"', 'AppleLogo className="size-5 text-foreground"')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            filepath = os.path.join(root, file)
            if replace_in_file(filepath):
                print(f"Updated: {filepath}")
                count += 1

print(f"Total files updated: {count}")
