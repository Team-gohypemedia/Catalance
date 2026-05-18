import os

src_dir = r"d:\Catalance\Catalance\src\components\Forms"

for file in ["PhoneAuth.jsx", "EmailAuth.jsx"]:
    filepath = os.path.join(src_dir, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace the Catalance desktop heading
    content = content.replace(
        'text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl',
        'text-4xl font-semibold tracking-[-0.05em] text-[#1c325b] dark:text-white sm:text-6xl lg:text-7xl'
    )
    
    # Replace the Catalance mobile heading
    content = content.replace(
        'text-[2.15rem] font-medium leading-none tracking-[-0.02em] text-foreground',
        'text-[2.15rem] font-medium leading-none tracking-[-0.02em] text-[#1c325b] dark:text-white'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
