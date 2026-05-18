import os
import re

# Define the directory to search
src_dir = r"d:\Catalance\Catalance\src"

# Define the replacements
replacements = {
    r'ring-amber-\d+': 'ring-primary/20',
    r'ring-yellow-\d+': 'ring-primary/20',
    r'ring-orange-\d+': 'ring-primary/20',
    r'hover:bg-\[#ffd54f\]': 'hover:bg-primary/80',
    r'bg-amber-950': 'bg-primary/90',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            content = f.read()
        except UnicodeDecodeError:
            return False # Skip binary files
    
    new_content = content
    for pattern, subst in replacements.items():
        new_content = re.sub(pattern, subst, new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.tsx', '.ts')):
            filepath = os.path.join(root, file)
            if replace_in_file(filepath):
                print(f"Updated: {filepath}")
                count += 1

print(f"Total files updated: {count}")
