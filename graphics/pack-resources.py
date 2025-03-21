#!/usr/bin/python

import os
import shutil
import subprocess


def pack_directory(project_dir, input_dir, output_path):
    # Pack.
    packer_path = os.path.join(project_dir, 'pack.js')
    
    input_json = os.path.join(project_dir, input_dir, 'texture_packer.json')
    if os.path.exists(input_json):
        subprocess.Popen([
            'node',
            packer_path,
            '-t',
            'remote', 
            '-a',
            'http://10.10.50.17:3456',
            '-i',
            input_json,
            '-o',
            output_path
        ]).wait()

if __name__ == '__main__':
    current_dir = os.path.dirname(os.path.realpath(__file__))
    project_dir = os.path.join(current_dir, '')
    
    # Danh sách các thư mục cần pack
    input_dirs = [
        'images',
        'images/backgrounds',
        'images/scoreboard', 
        'images/flags'
    ]
    
    output_path = os.path.join(project_dir, '..\\', 'src\\assets\\game\\images')
    
    # Pack từng thư mục
    for input_dir in input_dirs:
        pack_directory(project_dir, input_dir, output_path)

