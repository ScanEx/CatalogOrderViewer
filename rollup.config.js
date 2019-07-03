import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
    input: 'src/App.svelte',
    output: {
        file: pkg.module,
        format: 'cjs',
        sourcemap: true,        
    },
    plugins: [       
        svelte(),
        resolve(),            
        commonjs(),
        json(),
        copy({
            targets: [
                {src: 'src/*.png', dest: './dist'}
            ]
        }),
        babel({
            include: 'node_modules/svelte/shared.js',
            exclude: 'node_modules/**'
        })
    ]
};