from flask import Blueprint, jsonify, send_file
from pathlib import Path
import json
import os
import zlib
import io

mesh_bp = Blueprint('mesh', __name__, url_prefix='/api/mesh')

@mesh_bp.route('/metadata')
def get_mesh_metadata():
    try:
        # 使用绝对路径
        meta_path = Path(__file__).resolve().parent.parent.parent / 'data/processed/mesh/metadata.json'
        print(f"Absolute metadata path: {meta_path}")
        
        if not meta_path.exists():
            return jsonify({'error': f'Metadata file not found at {meta_path}'}), 404
        print(f"load mesh meatadata", meta_path)  
        return jsonify(json.loads(meta_path.read_text()))
    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@mesh_bp.route('/chunk/<int:chunk_id>', methods=['GET'])
def get_mesh_chunk(chunk_id):
    try:
        # 使用Python的字符串格式化补零
        chunk_filename = f"coords_{chunk_id:04d}.bin"
        chunk_path = Path(__file__).resolve().parent.parent.parent / f'data/processed/mesh/{chunk_filename}'
        
        # print(f"Looking for chunk file: {chunk_path}")
        
        if not chunk_path.exists():
            return jsonify({'error': f'Chunk file {chunk_filename} not found'}), 404
            
        print(f"send mesh chunk file: {chunk_path}")
        data = chunk_path.read_bytes()
    
        # 解压缩
        # if load_metadata('mesh').get('compressed', False):
        data = zlib.decompress(data)
        
        return send_file(
            io.BytesIO(data),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=f'chunk_{chunk_id}.bin'
        )
        # return send_file(str(chunk_path), mimetype='application/octet-stream')
    except Exception as e:
        print(f'Error loading chunk: {str(e)}')
        return jsonify({'error': str(e)}), 500