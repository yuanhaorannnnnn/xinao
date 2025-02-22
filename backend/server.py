from flask import Flask, send_from_directory
from flask_cors import CORS
from api.mesh_api import mesh_bp
from api.field_api import field_bp
import os

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# 注册蓝图
app.register_blueprint(mesh_bp)
app.register_blueprint(field_bp)

# 配置前端路由
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(port=5000, debug=True)