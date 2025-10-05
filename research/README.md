# Research Documentation

This directory contains markdown files for research documentation that will be displayed on the mechanisms-showcase website.

## Adding New Research

To add new research documentation:

### 1. Create the Markdown File

Create a new `.md` file in this directory with a descriptive slug name:

```
public/research/your-research-slug.md
```

### 2. Add Images (if needed)

Place any images referenced in your markdown in this same directory:

```
public/research/your-image.png
```

Reference them in your markdown using absolute paths:

```markdown
![Image Description](/research/your-image.png)
```

### 3. Update the Research Index

Edit `/app/research/page.tsx` and add a new entry to the `researchItems` array:

```typescript
{
  slug: 'your-research-slug',  // Must match your .md filename (without .md extension)
  title: 'Your Research Title',
  description: 'Brief description of what this research covers...',
  topics: [
    'Topic 1',
    'Topic 2',
    'Topic 3',
  ],
  date: '2025-10-04',  // Publication date
  status: 'Active Research'  // or 'Completed', 'In Progress', etc.
}
```

### 4. Markdown Features

The research pages support:

- **Standard Markdown**: Headers, lists, links, images, etc.
- **Mathematical Equations**: Using KaTeX syntax
  - Inline: `$equation$`
  - Block: `$$equation$$`
- **Code Blocks**: With syntax highlighting
- **Tables**: Standard markdown tables
- **Custom Styling**: Automatic dark theme styling

### 5. Mathematical Notation

Use KaTeX syntax for mathematical expressions:

```markdown
Inline equation: $E = mc^2$

Block equation:
$$
\theta_{rolling} = \frac{2\pi - n \times \theta_{big}}{n}
$$
```

### 6. Protection

All research pages are automatically protected and require authentication to view.

## Current Research

- **hypotrochoid-regular-polygon.md**: Two-Radius Four-Arc Intermittent Hypotrochoid Mechanism

## File Structure

```
public/research/
├── README.md                              # This file
├── hypotrochoid-regular-polygon.md        # Research markdown
├── geometric_origin_diagram.png           # Associated images
└── [other-research-files]
```

## Notes

- Keep markdown files focused and well-organized
- Use descriptive slugs for easy URL access
- Images should be optimized for web (PNG or JPG)
- Different research can have completely different formats - the markdown rendering is flexible
- No rigid templates - structure your research as needed for clarity