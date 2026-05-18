import os
import re

src_dir = r"d:\Catalance\Catalance\src\components\Forms"

replacements = {
    r'text-white/42': 'text-black/42 dark:text-white/42',
    r'text-white/45': 'text-black/45 dark:text-white/45',
    r'text-white/50': 'text-black/50 dark:text-white/50',
    r'text-white/55': 'text-black/55 dark:text-white/55',
    r'text-white/58': 'text-black/58 dark:text-white/58',
    r'text-white/68': 'text-black/68 dark:text-white/68',
    r'text-white/72': 'text-black/72 dark:text-white/72',
    r'text-white(?!/)': 'text-black dark:text-white',
    
    r'bg-\[\#101010\]/90': 'bg-white/90 dark:bg-[#101010]/90',
    r'bg-\[\#121212\]': 'bg-white dark:bg-[#121212]',
    
    r'bg-white/5': 'bg-black/5 dark:bg-white/5',
    r'bg-white/\[0\.03\]': 'bg-black/[0.03] dark:bg-white/[0.03]',
    r'bg-white/\[0\.06\]': 'bg-black/[0.06] dark:bg-white/[0.06]',
    r'bg-white/12': 'bg-black/12 dark:bg-white/12',
    r'hover:bg-white/\[0\.06\]': 'hover:bg-black/[0.06] dark:hover:bg-white/[0.06]',
    r'hover:text-white': 'hover:text-black dark:hover:text-white',
    
    r'border-white/10': 'border-black/10 dark:border-white/10',
    r'border-white/12': 'border-black/12 dark:border-white/12',
    r'border-white/15': 'border-black/15 dark:border-white/15',

    r'shadow-\[0_30px_120px_-60px_rgba\(0,0,0,0\.95\)\]': 'shadow-[0_30px_120px_-60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)]',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, subst in replacements.items():
        new_content = re.sub(pattern, subst, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

count = 0
for file in ["PhoneAuth.jsx", "EmailAuth.jsx"]:
    filepath = os.path.join(src_dir, file)
    if os.path.exists(filepath):
        if replace_in_file(filepath):
            print(f"Updated: {filepath}")
            count += 1

print(f"Total files updated: {count}")
