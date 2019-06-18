import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-porter';
import copy from 'rollup-plugin-cpy';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
    input: 'Client/index.js',
    output: {
        file: pkg.browser,
        format: 'iife',
        sourcemap: true,
        name: 'App',
    },
    plugins: [       
        svelte(),
        resolve(),            
        commonjs(),
        json(),
        css({dest: 'Server/wwwroot/main.css', minified: true}),
        copy({
            files: [                    
                'Client/Images/*.png',
                'Client/Images/*.svg',
            ],
            dest: 'Server/wwwroot',
        }),
        babel({
            include: 'node_modules/svelte/shared.js',
            exclude: 'node_modules/**'
        })
    ]
};