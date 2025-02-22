from flask import Flask, jsonify, send_file
from flask_cors import CORS
import json
from pathlib import Path
import zlib

app = Flask(__name__)
CORS(app)
DATA_ROOT = Path('./data/processed')

# 辅助函数
def load_metadata(data_type, field_name=None):
    if data_type == 'mesh':
        path = DATA_ROOT / 'mesh/metadata.json'
    elif data_type == 'field':
        path = DATA_ROOT / f'{field_name}/metadata.json'
    else:
        return None
    return json.loads(path.read_text())

@app.route('/api/mesh/metadata')
def get_mesh_metadata():
    return jsonify(load_metadata('mesh'))

@app.route('/api/field/metadata/<field_name>')
def get_field_metadata(field_name):
    return jsonify(load_metadata('field', field_name))

@app.route('/api/mesh/chunk/<int:chunk_id>')
def get_mesh_chunk(chunk_id):
    chunk_path = DATA_ROOT / f'mesh/coords_{chunk_id:04d}.bin'
    data = chunk_path.read_bytes()
    
    # 解压缩
    if load_metadata('mesh').get('compressed', False):
        data = zlib.decompress(data)
    
    return send_file(
        io.BytesIO(data),
        mimetype='application/octet-stream',
        as_attachment=True,
        download_name=f'chunk_{chunk_id}.bin'
    )

@app.route('/api/field/chunk/<field_name>/<int:chunk_id>')
def get_field_chunk(field_name, chunk_id):
    chunk_path = DATA_ROOT / f'{field_name}/{field_name}_c0_{chunk_id:04d}.bin'
    data = chunk_path.read_bytes()
    
    # 解压缩
    if load_metadata('field', field_name).get('compressed', False):
        data = zlib.decompress(data)
    
    return send_file(
        io.BytesIO(data),
        mimetype='application/octet-stream',
        as_attachment=True,
        download_name=f'chunk_{chunk_id}.bin'
    )

if __name__ == '__main__':
    app.run(port=5000, debug=True)