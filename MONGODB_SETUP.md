# MongoDB Atlas Setup Instructions

## Step 1: Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the free tier (M0) for development

## Step 2: Create a Cluster
1. Click "Create" to create a new cluster
2. Choose "M0 Cluster" (free tier)
3. Select your preferred cloud provider and region
4. Click "Create Cluster" (this may take a few minutes)

## Step 3: Set up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (save these!)
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
4. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. It will look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## Step 6: Update Environment Variables
1. Open the `.env` file in the backend folder
2. Replace the `MONGODB_URI` value with your Atlas connection string
3. Make sure to replace `<username>`, `<password>`, and `<database>` in the URL
4. Your final URL should look like: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/learnova?retryWrites=true&w=majority`

## Step 7: Test the Connection
1. Run `npm start` in the backend folder
2. You should see "Connected to MongoDB" in the console
3. The app will automatically create default users on first run

## Security Notes
- For production, restrict IP access to specific addresses
- Use strong passwords
- Consider using MongoDB Atlas's built-in authentication features
- Never commit the `.env` file to version control