# ORTB Validation Tool

A comprehensive OpenRTB 2.6 validation and sample generation tool that enables users to validate ORTB requests against IAB specifications and generate sample requests for sharing with publishers.

## Project Structure

```
src/
├── models/           # TypeScript interfaces and data models
│   ├── ortb.ts      # OpenRTB 2.6 data model interfaces
│   ├── validation.ts # Validation result interfaces
│   ├── sample.ts    # Sample generation interfaces
│   └── index.ts     # Export all models
├── services/         # Service layer interfaces
│   ├── validation-service.ts # Validation service interface
│   ├── sample-service.ts     # Sample generation service interface
│   ├── schema-service.ts     # Schema management service interface
│   └── index.ts             # Export all services
├── validation/       # Validation engine and utilities
│   ├── validation-engine.ts # Core validation engine interface
│   ├── schema-manager.ts    # Schema management interface
│   ├── validation-rules.ts  # Validation rules interface
│   └── index.ts            # Export all validation utilities
├── ui/              # User interface components and types
│   ├── components.ts # UI component interfaces
│   ├── types.ts     # UI type definitions
│   └── index.ts     # Export all UI interfaces
└── index.ts         # Main entry point
```

## Features

- **ORTB Request Validation**: Validate OpenRTB 2.6 requests against IAB specifications
- **Sample Generation**: Generate compliant sample ORTB requests for different ad types
- **Detailed Reporting**: Comprehensive validation reports with error categorization
- **Batch Processing**: Support for validating and generating multiple requests
- **Export Functionality**: Export samples and reports in multiple formats
- **Web Interface**: User-friendly web interface for validation and generation

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development Commands

```bash
# Build the project
npm run build

# Build in watch mode
npm run build:watch

# Run in development mode
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## Implementation Status

This project follows a structured implementation plan with the following tasks:

- [x] **Task 1**: Set up project structure and core interfaces
- [ ] **Task 2**: Implement ORTB data models and type definitions
- [ ] **Task 3**: Create schema management system
- [ ] **Task 4**: Implement core validation engine
- [ ] **Task 5**: Create sample generation system
- [ ] **Task 6**: Implement validation service layer
- [ ] **Task 7**: Build export and sharing functionality
- [ ] **Task 8**: Create web-based user interface
- [ ] **Task 9**: Implement API layer and service integration
- [ ] **Task 10**: Add comprehensive error handling and user feedback
- [ ] **Task 11**: Performance optimization and caching
- [ ] **Task 12**: Integration testing and end-to-end validation

## Architecture

The tool follows a layered architecture with clear separation of concerns:

- **Models Layer**: TypeScript interfaces for ORTB data models and validation results
- **Services Layer**: Business logic and orchestration services
- **Validation Layer**: Core validation engine and schema management
- **UI Layer**: Web-based user interface components

## OpenRTB 2.6 Compliance

This tool is designed to validate against the IAB OpenRTB 2.6 specification, ensuring:

- Required field validation
- Optional field format validation
- Cross-field validation rules
- Enumerated value validation
- Business logic validation

## License

MIT License