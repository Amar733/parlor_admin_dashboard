# How to Create a New Prescription Template

This guide explains how to add a new custom design (template) for prescriptions.

## 1. Create the Template File
Navigate to `components/prescription-templates/` and create a new file, e.g., `MyNewTemplate.tsx`.

Copy the following basic structure:

```tsx
import React from "react";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";
// Import other UI components as needed (Button, icons, etc.)

const MyNewTemplate: React.FC<PrescriptionTemplateProps> = ({
  doctor,
  patient,
  notes,
  rows,
  // ... destruct other props as needed (see types.ts for full list)
  scale,
  contentHeight,
  padRef,
  isPreviewMode,
  getImageUrl
}) => {
    // Standard A4 dimensions
    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;

  return (
    <div 
        id="prescription-print-wrapper"
        // Wrapper wrapper styles for print scaling
        style={{ 
            width: PAPER_WIDTH * scale, 
            height: contentHeight * scale,
            position: 'relative',
            margin: '0 auto'
        }}
        className="print:!w-[210mm] print:!h-auto print:!transform-none print:!static shrink-0 max-w-full pb-8"
    >
        <div 
            id="prescription-pad"
            ref={padRef}
            // Main canvas styling
            className="relative bg-white shadow-2xl print:shadow-none overflow-visible print:overflow-visible print:!transform-none origin-top-left select-none flex-shrink-0"
            style={{ 
                width: PAPER_WIDTH, 
                minHeight: PAPER_HEIGHT,
                height: 'auto',
                transform: `scale(${scale})`
            }}
        >
            {/* --- YOUR DESIGN GOES HERE --- */}
            
            {/* Example: Header */}
            <div className="p-8">
                <h1 className="text-2xl font-bold">{doctor.clinicName}</h1>
            </div>

            {/* Example: Inputs */}
            {/* Use PrintableInput for data that needs to be editable + printable */}
            <PrintableInput 
                value={patient.name}
                className="font-bold text-lg"
                onChange={(e: any) => handlePatientChange("name", e.target.value)}
                readOnly={isPreviewMode}
            />

            {/* --- END YOUR DESIGN --- */}
        </div>
    </div>
  );
};

export default MyNewTemplate;
```

## 2. Register the Template
You need to tell the main `PrescriptionCanvas.tsx` about your new template.

### A. Add to Theme Selector
Open `components/PrescriptionCanvas.tsx` and find the `Select Prescription Theme` dialog (search for `Select Prescription Theme`).

Add a new button for your template:

```tsx
<Button 
    variant={templateTheme === 'my-new-theme' ? 'default' : 'outline'} 
    className="h-24 flex flex-col gap-2" 
    onClick={() => setTemplateTheme('my-new-theme')} // Unique ID for your theme
>
    <div className="w-full h-12 bg-gray-200 border rounded flex items-center justify-center text-xs">
        My New Theme
    </div>
    New Theme Name
</Button>
```

### B. Render the Template
In `components/PrescriptionCanvas.tsx`, find the `switch (templateTheme)` block (usually near the bottom return statement).

Add a case for your new theme ID:

```tsx
import MyNewTemplate from "./prescription-templates/MyNewTemplate"; // Don't forget to import it!

// ... inside the component ...

switch (templateTheme) {
    case 'modern':
        return <ModernTemplate {...props} />;
    case 'minimal':
        return <MinimalTemplate {...props} />;
    case 'my-new-theme': // Match the ID you used in the button
        return <MyNewTemplate {...props} />;
    default:
        return <DefaultTemplate {...props} />;
}
```

## 3. Styling Guidelines
- **Tailwind CSS**: Use Tailwind classes for most styling.
- **Printing**: 
    - Use `print:hidden` to hide elements (like buttons) when printing.
    - Use `print:block` or `print:flex` to show specific print-only layouts.
    - **Crucial**: Always keep the `print:!transform-none` class on the wrapper divs as shown in step 1 to ensure correct A4 sizing.
- **Shared Components**:
    - Use `<PrintableInput />` for single-line text fields.
    - Use `<PrintableTextarea />` for multi-line text fields.
    - These components handle the switch between "edit mode" (input) and "print mode" (text) automatically.
