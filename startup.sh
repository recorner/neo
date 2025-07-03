#!/bin/sh

# Run JWT secret generation script in the background
node generateSecret.js &

# Start your main application
exec "$@"
