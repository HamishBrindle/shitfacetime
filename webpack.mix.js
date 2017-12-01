let mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('resources/assets/js/app.js', 'public/js')
    .copy('node_modules/picnic/releases/picnic.min.css', 'public/css')
    .copy('node_modules/picnic/releases/plugins.min.css', 'public/css')
    .copy('node_modules/jquery/dist/jquery.min.js', 'public/js')
    .copy('node_modules/peerjs/dist/peer.min.js', 'public/js')
    .sass('resources/assets/sass/app.scss', 'public/css');
