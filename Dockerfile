# Use the oven/bun image as the base
FROM oven/bun

# Get python 3
RUN apt-get update && apt-get install -y python3 python3-pip



# Set the environment variable to make ffmpeg recognized as a system command
ENV PATH="/usr/bin:${PATH}"

# Add your application's files to the container
COPY . /app

# Set the working directory
WORKDIR /app

# Install the dependencies
RUN bun install

# The command to run your application
CMD ["bun", "run", "index.ts"]
