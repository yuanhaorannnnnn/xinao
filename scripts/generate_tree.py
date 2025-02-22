import os
from pathlib import Path

def generate_directory_structure(root_dir, output_file="structure.txt", exclude_dirs=None):
    """
    生成目录结构到文本文件
    :param root_dir: 根目录路径
    :param output_file: 输出文件名
    :param exclude_dirs: 需要排除的目录列表
    """
    if exclude_dirs is None:
        exclude_dirs = ['.git', '__pycache__', 'venv']

    root_path = Path(root_dir)
    with open(output_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(root_path):
            # 过滤排除目录
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            level = root.replace(str(root_path), '').count(os.sep)
            indent = '│   ' * (level - 1) + '├── ' if level > 0 else ''
            
            # 写入当前目录
            f.write(f'{indent}{os.path.basename(root)}/\n')
            
            # 写入文件
            sub_indent = '│   ' * level + '├── '
            for i, file in enumerate(files):
                if i == len(files) - 1 and not dirs:  # 最后一个元素调整样式
                    sub_indent = '│   ' * level + '└── '
                f.write(f'{sub_indent}{file}\n')

if __name__ == "__main__":
    generate_directory_structure(
        root_dir=".", 
        output_file="repo_structure.txt",
        exclude_dirs=['.git', 'node_modules', 'docs', 'tests', '__pycache__']
    )