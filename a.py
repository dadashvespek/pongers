import os
import pyperclip
import sys

def copy_src_folder_to_clipboard(src_path='./src'):
    result = []
    file_count = 0
    
    for root, dirs, files in os.walk(src_path):
        rel_path = os.path.relpath(root, os.path.dirname(src_path))
        if rel_path != '.':
            result.append(f"\n{rel_path}")
        
        for file in files:
            file_count += 1
            file_path = os.path.join(root, file)
            result.append(f"\n{file}")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    result.append(f"```\n{content}\n```")
            except Exception as e:
                result.append(f"[Error reading file: {str(e)}]")
    
    output = "\n".join(result)
    pyperclip.copy(output)
    print(f"Copied {file_count} files from {src_path} to clipboard")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else './src'
    copy_src_folder_to_clipboard(path)