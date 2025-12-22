# API Integration Documentation

## Overview
The sales person pages have been successfully integrated with the backend APIs provided by the development team.

## API Endpoints Integrated

### Sales Person APIs
- **GET** `/api/sales-person` - List all sales persons with pagination and filters
- **GET** `/api/sales-person/{id}` - Get sales person details by ID
- **POST** `/api/sales-person/import` - Import sales person data from Excel file

### Client APIs
- **GET** `/api/client` - List all clients with pagination and filters
- **GET** `/api/client/{id}` - Get client details by ID
- **POST** `/api/client/import` - Import client data from Excel file

### Health Check
- **GET** `/` - Health check endpoint

## Updated Pages

### 1. Sales Home (`src/pages/sales/Home.tsx`)
- **Daily Upload Functionality**: Added file upload dialogs for importing client/sales person data
- **Real-time Data**: Integrated with backend APIs for dynamic data loading
- **Task Management**: Enhanced task creation form with proper data structure
- **Upload Dialog**: Modal dialog for Excel file uploads with progress indicators

### 2. Sales Leads (`src/pages/sales/Leads.tsx`)
- **API Integration**: Now loads real client data from the backend
- **Search Functionality**: Implemented search with API integration
- **Pagination**: Added pagination support for large datasets
- **Loading States**: Added loading indicators and error handling
- **Data Transformation**: Converts API client data to lead format for display

### 3. Sales Follow-ups (`src/pages/sales/Followups.tsx`)
- **Enhanced Data Structure**: Updated to match the flowchart requirements
- **Create Follow-up**: Added comprehensive form for creating new follow-ups
- **Task Types**: Support for New Order, Pending Order, and Pending Material
- **Card Layout**: Improved visual presentation with detailed information cards

## Configuration

### API Configuration (`src/config/api.ts`)
- Centralized API configuration
- Authentication token management
- Endpoint definitions
- Header utilities

### API Service (`src/services/api.ts`)
- Abstracted API calls
- Error handling
- Type-safe interfaces
- Reusable service functions

## Features Implemented

### File Upload System
- Excel file upload for sales person and client data
- Progress indicators during upload
- Success/error feedback
- File validation (Excel files only)

### Search and Filtering
- Real-time search functionality
- Status-based filtering
- Pagination support
- Loading states

### Data Management
- Real-time data loading from APIs
- Automatic data refresh after uploads
- Error handling and user feedback
- Responsive design for all screen sizes

## Authentication
All API calls use the provided authentication token:
```
x-auth-token: ru498ru849ur3984ur849uvm48uv48r48mr4339ie09cr8y4783brv74ryn38uc093rcm493fnvr
```

## Database Connection
The system connects to the Supabase PostgreSQL database:
```
postgresql://postgres:Jewelai@123@db.tswtavczhritutnvafzq.supabase.co:5432/postgres
```

## Usage Instructions

1. **Daily Upload**: Use the upload buttons on the dashboard to import Excel files
2. **Search Clients**: Use the search bar in the Leads page to find specific clients
3. **Create Tasks**: Use the "Add New Task" button to create follow-up tasks
4. **Create Follow-ups**: Use the "Create Follow-up" button for detailed follow-up management

## Error Handling
- Network errors are caught and logged
- User-friendly error messages
- Graceful fallbacks for failed API calls
- Loading states prevent user confusion

## Future Enhancements
- Real-time notifications for new tasks
- Advanced filtering options
- Export functionality
- Bulk operations
- Dashboard analytics