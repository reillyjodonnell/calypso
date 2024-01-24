# Use the oven/bun image as the base
FROM oven/bun

# Update the package list and install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg

# Set the environment variable to make ffmpeg recognized as a system command
ENV PATH="/usr/bin:${PATH}"

# Add your application's files to the container
COPY . /app

# Set the working directory
WORKDIR /app

# The command to run your application
CMD ["bun", "run", "index.ts"]
