# Pages Management

A comprehensive content management system for creating and managing website pages with rich text editing capabilities.

## Features

### ✨ Rich Text Editor
- **Full WYSIWYG Editor**: Uses ReactQuill for professional rich text editing
- **Comprehensive Formatting**: Headers, fonts, colors, alignment, lists, links, images
- **Live Preview**: Real-time preview of content as you type
- **HTML Output**: Generates clean, semantic HTML
 
### 📄 Page Management
- **CRUD Operations**: Create, read, update, and delete pages
- **Auto Slug Generation**: Automatically generates URL-friendly slugs from page names
- **Status Management**: Active/Inactive status control
- **Position Control**: Organize pages by position (header, footer, sidebar)

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface following the existing CMS design patterns
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Content Preview**: Live preview of formatted content
- **Content Snippets**: Quick preview of page content in the list view

## Usage

### Accessing Pages Management
Navigate to: **Dashboard → CMS → Pages**

### Creating a New Page
1. Click the **"Add Page"** button
2. Fill in the page details:
   - **Name**: Display name for the page
   - **Slug**: URL-friendly identifier (auto-generated from name)
   - **Position**: Where the page should appear (header/footer/sidebar)
   - **Status**: Active or Inactive
   - **Content**: Rich text content using the WYSIWYG editor
3. Use the rich text editor to format your content
4. Preview your content in real-time
5. Click **"Create Page"** to save

### Editing an Existing Page
1. Find the page in the list
2. Click the **Edit** button
3. Modify the page details and content
4. Click **"Update Page"** to save changes

### Deleting a Page
1. Find the page in the list
2. Click the **Delete** button
3. Confirm the deletion in the popup dialog

## Rich Text Editor Features

### Formatting Options
- **Headers**: H1 through H6
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Colors**: Text color and background color
- **Alignment**: Left, center, right, justify
- **Lists**: Ordered and unordered lists
- **Links**: Insert and edit hyperlinks
- **Images**: Insert images (with upload support)
- **Code**: Inline code and code blocks
- **Quotes**: Blockquotes for emphasis

### Keyboard Shortcuts
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo

## API Integration

The pages management system integrates with your backend API. See `API_DOCUMENTATION.md` for complete API specifications.

### Required Endpoints
- `GET /api/pages` - Get all pages
- `GET /api/pages/{slug}` - Get page by slug
- `POST /api/pages` - Create new page
- `PUT /api/pages/{id}` - Update existing page
- `DELETE /api/pages/{id}` - Delete page

## File Structure

```
app/dashboard/cms/pages/
├── page.tsx                 # Main pages management component
├── API_DOCUMENTATION.md     # Backend API specifications
└── README.md               # This documentation

components/
├── tinymce-editor.tsx       # Rich text editor component
└── page-content-preview.tsx # Content preview component
```

## Technical Details

### Dependencies
- **ReactQuill**: Rich text editor
- **React Hook Form**: Form handling
- **Tailwind CSS**: Styling
- **Radix UI**: UI components

### Data Flow
1. **Load Pages**: Fetch all pages from API on component mount
2. **Create/Edit**: Open modal dialog with form and rich text editor
3. **Save**: Send data to API and refresh the list
4. **Delete**: Confirm deletion and remove from API

### Content Handling
- **HTML Storage**: Rich text content is stored as HTML
- **Sanitization**: Content should be sanitized on the backend
- **Preview**: Live preview shows exactly how content will appear
- **Responsive**: Content adapts to different screen sizes

## Customization

### Styling
The component uses Tailwind CSS classes and can be customized by modifying the class names in the component files.

### Rich Text Editor
The ReactQuill editor can be customized by modifying the `modules` and `formats` configuration in `tinymce-editor.tsx`.

### API Configuration
Update the API base URL in `config/api.ts` to point to your backend server.

## Troubleshooting

### Common Issues

**Rich text editor not loading**
- Ensure ReactQuill is properly installed: `npm install react-quill`
- Check for JavaScript errors in the browser console

**Content not saving**
- Verify API endpoints are implemented on the backend
- Check network requests in browser developer tools
- Ensure proper authentication headers are sent

**Styling issues**
- Import ReactQuill CSS: `import 'react-quill/dist/quill.snow.css'`
- Check for CSS conflicts with existing styles

### Performance Optimization
- The ReactQuill component is dynamically imported to avoid SSR issues
- Large content is handled efficiently with proper state management
- API calls are optimized with proper loading states

## Future Enhancements

### Planned Features
- **Image Upload**: Direct image upload within the rich text editor
- **Template System**: Pre-defined page templates
- **Version History**: Track and restore previous versions
- **SEO Optimization**: Meta tags and SEO-friendly features
- **Bulk Operations**: Bulk edit, delete, and status changes
- **Search and Filter**: Find pages quickly with search functionality

### Integration Possibilities
- **Media Library**: Integration with existing media management
- **User Permissions**: Role-based access control
- **Workflow**: Approval process for page publishing
- **Analytics**: Track page views and engagement