FROM arangodb:latest

# Optional: Add maintainer info
LABEL maintainer="behani.julien@gmx.fr"

# Example: Copy a custom configuration file into the container
# You must have a file named 'arangod.conf' in the same directory
COPY arangod.conf /etc/arangodb3/arangod.conf

# Example: Copy a setup script to be run on startup (if supported by your entrypoint logic)
# COPY setup.js /docker-entrypoint-initdb.d/

EXPOSE 8529

CMD ["arangod"]