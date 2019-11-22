import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-porter';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
    input: 'src/App.svelte',
    external: ['scanex-translations'],
    output: {
        file: pkg.module,
        format: 'cjs',
        sourcemap: true,
        globals: {
            'scanex-translations': 'T'
        }
    },
    plugins: [       
        svelte(),
        resolve(),            
        commonjs(),
        json(),
        css({dest: 'dist/catalog-order-viewer.css', minify: false}),
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