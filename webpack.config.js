const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        libraryTarget: 'commonjs',
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                include: [
                    path.resolve(__dirname, 'src')
                ],
                use: 'ts-loader',
                exclude: /node-modules/
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
        alias: {
            "jinaga": "jinaga/dist/jinaga"
        }
    },
    externals: {
        jinaga: 'jinaga',
        react: 'react'
    }
};