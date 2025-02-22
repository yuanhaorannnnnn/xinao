from flask import Blueprint, jsonify, send_file
from pathlib import Path
import json
import zlib
import io

field_bp = Blueprint('field', __name__, url_prefix='/api/field')

@field_bp.route('/<field_name>/metadata')
def get_field_metadata(field_name):
    """获取物理场元数据"""
    try:
        meta_path = Path(f'data/processed/{field_name}/metadata.json')
        print(f'Field metadata path: {meta_path.absolute()}')
        return jsonify(json.loads(meta_path.read_text()))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@field_bp.route('/<field_name>/chunk/<int:chunk_id>')
def get_field_chunk(field_name, chunk_id):
    """获取物理场数据块"""
    try:
        chunk_path = Path(f'data/processed/{field_name}/{field_name}_c0_{chunk_id:04d}.bin')
        data = chunk_path.read_bytes()
        data = zlib.decompress(data)
        return send_file(
            io.BytesIO(data),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=f'chunk_{chunk_id}.bin'
        )
        # return send_file(chunk_path, mimetype='application/octet-stream')
    except FileNotFoundError:
        return jsonify({'error': 'Chunk not found'}), 404