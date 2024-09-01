# Use the official Node.js image as a base
FROM node

# Create and set the working directory in the container
WORKDIR /app

# Copy the rest of the application code to /app
COPY . .

RUN npm install

# Command to run the application
CMD npm start
# CMD tail -f /dev/null
