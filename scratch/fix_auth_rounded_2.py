import os
import re

src_dir = r"d:\Catalance\Catalance\src\components\Forms"

replacements = {
    # Add rounded-full to input class
    r'"phone-auth-autofill !h-10 !py-0"': '"phone-auth-autofill !h-10 !py-0 rounded-full"',
    r'"phone-auth-autofill !h-12 !py-0"': '"phone-auth-autofill !h-12 !py-0 rounded-full"',
    
    # Add rounded-full to select trigger
    r'"!h-10 !w-full"': '"!h-10 !w-full rounded-full"',
    r'"!h-12 !w-full"': '"!h-12 !w-full rounded-full"',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            content = f.read()
        except UnicodeDecodeError:
            return False
    
    new_content = content
    for pattern, subst in replacements.items():
        new_content = new_content.replace(pattern.strip('"\''), subst.strip('"\''))
        
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
