# File Upload and Address Selection Fixes

## Issues Fixed

### 1. File Upload Failure
**Problem**: The file upload feature was showing "File upload failed" because the upload endpoint was not implemented in the backend.

**Solution**: 
- Created a new upload route (`urbanhive/backend/routes/upload.route.js`)
- Implemented local file storage with multer
- Added proper error handling and file validation
- Updated the backend app.js to include the upload route

**Features**:
- Supports image files only (JPG, PNG, GIF, etc.)
- 5MB file size limit
- Automatic file naming with unique suffixes
- Proper error messages for different failure scenarios

### 2. Map-Based Address Selection
**Problem**: Users needed a way to select addresses from an interactive map instead of manual coordinate entry.

**Solution**:
- Added "Add Address from Map" button
- Integrated Mapbox GL JS for interactive map
- Implemented click-to-select functionality
- Added reverse geocoding to get address from coordinates
- Display selected location details in a read-only text area

**Features**:
- Interactive map with navigation controls
- Click anywhere on the map to select location
- Automatic address lookup using reverse geocoding
- Visual markers and popups for selected locations
- Coordinates display for selected locations

### 3. Manual Address Entry Option
**Problem**: Users needed an alternative to map selection for entering addresses manually.

**Solution**:
- Added "Manual Address Entry" button
- Created a textarea for manual address input
- Toggle between map and manual entry modes
- Display both selected locations in a unified interface

**Features**:
- Large textarea for complete address entry
- Helpful placeholder text and instructions
- Toggle between map and manual entry
- Unified display of selected location

## Technical Implementation

### Backend Changes

1. **New Upload Route** (`urbanhive/backend/routes/upload.route.js`):
   ```javascript
   // Upload endpoint
   POST /api/v1/upload
   
   // File serving endpoint
   GET /api/v1/uploads/:filename
   ```

2. **Updated App.js**:
   - Added upload router import
   - Registered upload routes

### Frontend Changes

1. **Updated CreateIssueModal.jsx**:
   - Added map integration with Mapbox GL JS
   - Added manual address entry option
   - Improved UI with toggle buttons
   - Enhanced location display

2. **Key Features**:
   - Three address selection methods:
     - Map-based selection
     - Manual address entry
     - Random address generator
   - Unified location display
   - Proper form state management

## Usage Instructions

### File Upload
1. Click "Choose File" in the image upload section
2. Select an image file (JPG, PNG, GIF, etc.)
3. File will be uploaded automatically
4. Success/error messages will be displayed

### Address Selection

#### Map-Based Selection:
1. Click "Add Address from Map" button
2. An interactive map will appear
3. Click anywhere on the map to select a location
4. The selected address and coordinates will be displayed below

#### Manual Address Entry:
1. Click "Manual Address Entry" button
2. A textarea will appear
3. Enter the complete address manually
4. The entered address will be displayed below

#### Random Address:
1. Click "Random Address" button
2. A random address will be selected and displayed

## Environment Variables

The following environment variables are used:

**Backend**:
```
PORT=8000
MONGO_URI=mongodb+srv://CivicSphere:CivicSphere@cluster0.gm8mz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=secretkey
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
EMAIL_USER=akshitham0931@gmail.com
EMAIL_PASS=pgca aawn bnyq pkka
```

**Frontend**:
```
VITE_BACKEND_URL=http://localhost:8000
```

## File Structure

```
urbanhive/
├── backend/
│   ├── routes/
│   │   └── upload.route.js          # New upload route
│   ├── uploads/                     # Created automatically
│   └── app.js                       # Updated with upload routes
└── frontend/
    └── src/
        └── pages/
            └── Issues/
                └── CreateIssueModel.jsx  # Updated with map and manual entry
```

## Testing

1. **File Upload Test**:
   - Try uploading different image formats
   - Test with files larger than 5MB (should show error)
   - Test with non-image files (should show error)

2. **Address Selection Test**:
   - Test map-based selection by clicking on different locations
   - Test manual address entry with various addresses
   - Test random address generation
   - Verify that both methods work independently

## Future Enhancements

1. **AWS S3 Integration**: Replace local storage with AWS S3 for production
2. **Image Compression**: Add automatic image compression for better performance
3. **Address Validation**: Add address validation for manual entries
4. **Geocoding**: Add forward geocoding for manual addresses to get coordinates
5. **Multiple File Upload**: Support for multiple image uploads
6. **Drag and Drop**: Add drag and drop functionality for file uploads 