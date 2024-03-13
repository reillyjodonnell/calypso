# Use the oven/bun image as the base
FROM oven/bun

# Set the environment variable to make ffmpeg recognized as a system command
ENV PATH="/usr/bin:${PATH}"

# Add your application's files to the container
COPY . /app

# Set the working directory
WORKDIR /app

# The command to run your application
CMD ["bun", "run", "index.ts"]
