# ORTB Validation Tool - Frontend

A modern, responsive React frontend for the OpenRTB 2.6 validation tool. Built with TypeScript, Tailwind CSS, and modern React patterns.

## 🚀 Features

### ✅ **ORTB Request Validator**
- Real-time JSON validation with Monaco Editor
- Detailed error reporting with suggestions
- Compliance scoring and level assessment
- File upload support for batch validation
- Export validation results (JSON, CSV, XML)

### 🎯 **Sample Generator**
- Generate compliant ORTB samples for all ad types:
  - Display Banner
  - Video (Instream/Outstream)
  - Native
  - Audio
- Template-based generation with customization
- Download generated samples
- Copy to clipboard functionality

### 📊 **Analytics Dashboard**
- Real-time validation metrics
- Success rate tracking
- Common error analysis
- Recent activity monitoring

### 📚 **Interactive Documentation**
- Complete OpenRTB 2.6 field reference
- Code examples and best practices
- Validation rules explanation
- Common error solutions

## 🛠 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **Monaco Editor** - VS Code-like JSON editor
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API server running on port 3000

### Setup Steps

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3001
   ```

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── JsonEditor.tsx   # Monaco-based JSON editor
│   │   ├── ValidationResults.tsx  # Validation results display
│   │   └── FileUpload.tsx   # Drag & drop file upload
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ValidatorPage.tsx # Main validation interface
│   │   ├── SampleGeneratorPage.tsx # Sample generation
│   │   ├── DocumentationPage.tsx   # Interactive docs
│   │   └── AnalyticsPage.tsx       # Analytics dashboard
│   ├── lib/                 # Utilities and API client
│   │   ├── api.ts          # API client with React Query
│   │   └── utils.ts        # Helper functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## 🎨 UI Components

### Core Components

- **JsonEditor** - Monaco-based editor with ORTB-specific features
- **ValidationResults** - Detailed error/warning display with suggestions
- **FileUpload** - Drag & drop interface for JSON files
- **Layout** - Responsive navigation and footer

### Design System

- **Colors**: Primary (blue), Success (green), Error (red), Warning (yellow)
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Card-based layout with subtle shadows
- **Responsive**: Mobile-first design with breakpoints

## 🔌 API Integration

The frontend communicates with the backend API through a centralized client:

```typescript
// API endpoints
POST /api/validate          - Validate ORTB request
POST /api/validate/batch    - Batch validation
POST /api/samples/generate  - Generate sample
GET  /api/samples/templates - Get templates
POST /api/export/validation - Export results
GET  /api/analytics         - Get analytics
```

### Error Handling
- Automatic retry for failed requests
- User-friendly error messages
- Loading states and feedback
- Offline detection

## 🎯 Key Features

### 1. **Real-time Validation**
```typescript
const validateMutation = useMutation({
  mutationFn: apiClient.validateRequest,
  onSuccess: (result) => {
    setValidationResult(result)
    toast.success('Validation successful!')
  }
})
```

### 2. **Monaco Editor Integration**
- Syntax highlighting for JSON
- Auto-completion and validation
- Format on save (Ctrl+S)
- Error highlighting

### 3. **Responsive Design**
- Mobile-optimized interface
- Touch-friendly interactions
- Adaptive layouts
- Progressive enhancement

### 4. **Performance Optimized**
- Code splitting by route
- Lazy loading of heavy components
- Optimized bundle size
- Fast development server

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Variables
Create `.env.local` for custom configuration:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_VERSION=1.0.0
```

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Husky for git hooks (optional)

## 🎨 Customization

### Styling
Modify `tailwind.config.js` to customize:
- Colors and themes
- Typography scales
- Spacing system
- Component variants

### Components
All components are modular and can be:
- Styled with Tailwind classes
- Extended with additional props
- Composed into new patterns
- Themed consistently

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the programmatic advertising community**