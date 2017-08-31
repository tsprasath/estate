#!/bin/bash
#webpack --hot --watch &
echo "Starting Webpack Server"
webpack-dev-server --config webpack/webpack.local.config.js &
echo "Starting Django Server"
exec django-admin runserver 0.0.0.0:8000
