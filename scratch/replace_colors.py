import os
import re

# Define the directory to search
src_dir = r"d:\Catalance\Catalance\src"

# Define the replacements
replacements = {
    # Specific Hex codes (yellow-ish)
    r'#FACC15': '#D9692A',
    r'#facc15': '#D9692A',
    r'#f59e0b': '#D9692A',
    r'#F59E0B': '#D9692A',
    r'#fbbf24': '#D9692A',
    r'#FBBF24': '#D9692A',
    r'#ffc107': '#D9692A',
    r'#FFC107': '#D9692A',
    r'#fdc800': '#D9692A',
    r'#FDC800': '#D9692A',
    r'#fdc800': '#D9692A',
    r'#FFD700': '#D9692A',
    r'#ffd700': '#D9692A',
    
    # Text colors
    r'text-yellow-\d+': 'text-primary',
    r'text-amber-\d+': 'text-primary',
    r'text-orange-\d+': 'text-primary',
    
    # Background colors
    r'bg-yellow-([1-9]00|50)': 'bg-primary/10',
    r'bg-amber-([1-9]00|50)': 'bg-primary/10',
    r'bg-orange-([1-9]00|50)': 'bg-primary/10',
    
    # High intensity background
    r'bg-yellow-(400|500|600)': 'bg-primary',
    r'bg-amber-(400|500|600)': 'bg-primary',
    r'bg-orange-(400|500|600)': 'bg-primary',
    
    # Border colors
    r'border-yellow-\d+': 'border-primary/20',
    r'border-amber-\d+': 'border-primary/20',
    r'border-orange-\d+': 'border-primary/20',
    
    # Fill colors
    r'fill-yellow-\d+': 'fill-primary',
    r'fill-amber-\d+': 'fill-primary',
    r'fill-orange-\d+': 'fill-primary',
    
    # Gradients
    r'from-yellow-\d+': 'from-primary',
    r'from-amber-\d+': 'from-primary',
    r'from-orange-\d+': 'from-primary',
    r'via-yellow-\d+': 'via-primary/50',
    r'via-amber-\d+': 'via-primary/50',
    r'via-orange-\d+': 'via-primary/50',
    r'to-yellow-\d+': 'to-primary/20',
    r'to-amber-\d+': 'to-primary/20',
    r'to-orange-\d+': 'to-primary/20',
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
