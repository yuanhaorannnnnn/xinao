import numpy as np
import json
import os
from pathlib import Path
import argparse
import zlib

THREE_DIMENSION_VECTOR_FIELDS = ['displace_vector']
SIX_DIMENSION_VECTOR_FIELDS = ['stress_tensor', 'strain_tensor']

THREE_ID_AXIX_MAP = {
    0: 'x',
    1: 'y',
    2: 'z'
}
SIX_ID_AXIX_MAP = {
    0: 'xx',
    1: 'yy',
    2: 'zz',
    3: 'xy',
    4: 'yz',
    5: 'xz'
}

def process_mesh(input_path, output_dir, chunk_size=50000, compress=True):
    """处理网格数据"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    data = np.load(input_path)
    coords = data['node_coords'].astype(np.float32)
    total_points = coords.shape[0]
    
    # 分块处理
    num_chunks = (total_points + chunk_size - 1) // chunk_size
    for i in range(num_chunks):
        start = i * chunk_size
        end = min((i+1)*chunk_size, total_points)
        chunk = coords[start:end]
        
        # 压缩存储
        chunk_bytes = chunk.tobytes()
        if compress:
            chunk_bytes = zlib.compress(chunk_bytes)
            
        with open(output_dir / f'coords_{i:04d}.bin', 'wb') as f:
            f.write(chunk_bytes)
    
    # 保存元数据
    metadata = {
        "total_points": total_points,
        "chunk_size": chunk_size,
        "total_chunks": num_chunks,  # 新增字段
        "dtype": "float32",
        "compressed": compress,
        "dimensions": 3
    }
    with open(output_dir / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

def process_field(input_path, field_name, output_dir, chunk_size=10240000, vecotr_dimension=0, compress=True):
    """处理物理场数据"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    data = np.load(input_path)
    field_data = data[field_name]
    
    # 处理多维数据
    if field_data.ndim == 1:
        if vecotr_dimension != 0:
            raise ValueError("Invalid vector dimension for non-vector field.")
        components = [field_data]
        print("field_data shape", field_data.shape, np.array(components).shape)
    else:
        # components = np.split(field_data, field_data.shape[1], axis=1)
        # get the dimension of the vector field
        components = [field_data[ : , vecotr_dimension]]
        print("field_data shape", field_data.shape, np.array(components).shape)

        if field_name in SIX_DIMENSION_VECTOR_FIELDS:
            field_name = field_name + '_' + SIX_ID_AXIX_MAP[vecotr_dimension]
            print('SIX_DIMENSION_VECTOR_FIELDS', field_name)
        elif field_name in THREE_DIMENSION_VECTOR_FIELDS:
            field_name = field_name + '_' + THREE_ID_AXIX_MAP[vecotr_dimension]
            print('THREE_DIMENSION_VECTOR_FIELDS', field_name)
        else:
            raise ValueError("Invalid field name or vector dimension.")
    
    for comp_idx, comp_data in enumerate(components):
        comp_data = comp_data.astype(np.float32).flatten()
        print("len comp_data", len(comp_data))
        
        # 分块处理
        num_chunks = (len(comp_data) + chunk_size - 1) // chunk_size
        for i in range(num_chunks):
            start = i * chunk_size
            end = min((i+1)*chunk_size, len(comp_data))
            chunk = comp_data[start:end]
            
            # 压缩存储
            chunk_bytes = chunk.tobytes()
            if compress:
                chunk_bytes = zlib.compress(chunk_bytes)
                
            with open(output_dir / f'{field_name}_c{comp_idx}_{i:04d}.bin', 'wb') as f:
                f.write(chunk_bytes)
        
        # 保存元数据
        metadata = {
            "field_name": f"{field_name}_c{comp_idx}" if len(components)>1 else field_name,
            "total_points": len(comp_data),
            "chunk_size": chunk_size,
            "total_chunks": num_chunks,  # 新增字段
            "dtype": "float32",
            "compressed": compress,
            "min": float(np.nanmin(comp_data)),
            "max": float(np.nanmax(comp_data)),
            "unit": "MPa" if "stress" in field_name else "mm"
        }
        with open(output_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Data Preprocessor')
    parser.add_argument('input', type=str, help='Input .npz file path')
    parser.add_argument('-t', '--type', choices=['mesh', 'field'], required=True)
    parser.add_argument('-f', '--field', type=str, help='Field name for field processing')
    parser.add_argument('-o', '--output', type=str, required=True, help='Output directory')
    parser.add_argument('-c', '--chunk', type=int, default=10240000, help='Chunk size')
    parser.add_argument('-d', '--vector_dimension', type=int, default=0, help='Vector dimension of the vector field')
    parser.add_argument('--no-compress', action='store_false', dest='compress')
    
    args = parser.parse_args()
    
    if args.type == 'mesh':
        process_mesh(args.input, args.output, args.chunk, args.compress)
    elif args.type == 'field':
        if not args.field:
            raise ValueError("Field name required for field processing")
        process_field(args.input, args.field, args.output, args.chunk, args.vector_dimension, args.compress)