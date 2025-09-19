# Overview

This is a satellite image change detection application that uses AI-powered analysis to identify and quantify changes between before-and-after satellite images. The application provides precise percentage measurements of detected changes and generates visual heatmaps to highlight areas of change. Built with a React frontend and Node.js/Express backend, it leverages modern image processing techniques and optional OpenAI integration for enhanced analysis capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with a custom satellite/space theme featuring deep blues and earth tones
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **Component Structure**: Modular components including ImageUpload, ComparisonResults, and LoadingState for the core functionality

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Image Processing**: Multiple libraries including Sharp, Jimp, and HTML5 Canvas for image manipulation and analysis
- **File Handling**: Multer for multipart file uploads with UUID-based file naming
- **API Integration**: Optional OpenAI API integration for enhanced AI analysis capabilities
- **Server Configuration**: CORS enabled for cross-origin requests, serves on port 5000

## Data Storage Solutions
- **File Storage**: Local filesystem storage in uploads directory for processed images
- **Session Management**: Stateless API design with file-based temporary storage
- **Image Metadata**: In-memory processing with metadata returned in API responses

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **API Security**: Basic CORS configuration with allowed origins list
- **File Access**: Direct file system access without user-based restrictions

## External Dependencies
- **Image Processing Libraries**: Sharp for high-performance image operations, Jimp for Canvas-compatible processing
- **UI Framework**: Radix UI primitives with Shadcn/ui component system
- **Development Tools**: ESLint for code quality, TypeScript for type safety
- **Optional AI Services**: OpenAI API integration for advanced change analysis (requires API key)
- **Build System**: Vite for fast development and optimized production builds

## Design Patterns
- **Component Composition**: Reusable UI components with props-based configuration
- **API Layer**: Centralized API service functions with TypeScript interfaces
- **Error Handling**: Toast notifications for user feedback and error states
- **Loading States**: Dedicated loading components with progress indicators
- **File Upload**: Drag-and-drop interface with file validation and preview
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

## Development Workflow
- **Dual Server Setup**: Custom start script runs both frontend (port 8080) and backend (port 5000) concurrently
- **Hot Reload**: Vite development server with automatic reloading
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Code Quality**: ESLint configuration with React-specific rules