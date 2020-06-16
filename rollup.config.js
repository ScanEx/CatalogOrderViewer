import pkg from './package.json';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import cpy from 'rollup-plugin-cpy';
import css from 'rollup-plugin-css-porter';
import babel from 'rollup-plugin-babel';

export default {
    input: pkg.module,
    external: ['@scanex/translations'],
    output: {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        globals: {
            '@scanex/translations': 'T'
        }
    },
    plugins: [       
        svelte(),
        resolve({
            dedupe: [
                '@scanex/translations',
                'core-js',
            ]
        }),
        commonjs(),
        json(),
        css({dest: 'dist/catalog-order-viewer.css', minify: false}),
        cpy([            
        	{files: 'src/*.png', dest: 'dist'}            
        ]),
        babel({                
                extensions: ['.js', '.svelte', '.mjs'],
                exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
                include: ['src/**', 'node_modules/svelte/**']
        }),
    ]
};