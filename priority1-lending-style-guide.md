# Priority 1 Lending — Style Guide for Cursor

> **Brand Essence**: "Your #1 resource for personalized mortgage solutions"
> **Tagline**: Close your home loan in as little as 8 days!
> **Founded**: 2015 | **Location**: Livonia, Michigan | **NMLS**: #1375378

---

## Brand Positioning

Priority 1 Lending is a technology-forward mortgage company that revolutionizes the home loan process through proprietary task allocation systems and automation. The brand communicates **trust**, **efficiency**, **expertise**, and **personalization**.

**Core Differentiators**:
- Assembly line format with experts at every stage
- Top-of-the-line technology platform
- Fast closing times (as little as 8 days)
- Personalized mortgage options

---

## Color Palette

### Primary Colors
```css
:root {
  /* Primary Blue — Trust, professionalism, stability */
  --p1l-primary: #1E3A5F;           /* Deep navy blue */
  --p1l-primary-light: #2D5A8A;     /* Medium blue */
  --p1l-primary-dark: #0F1F33;      /* Dark navy */
  
  /* Accent — Energy, action, urgency */
  --p1l-accent: #E8632B;            /* Warm orange */
  --p1l-accent-light: #F07D4A;      /* Light orange */
  --p1l-accent-dark: #C54D1A;       /* Deep orange */
  
  /* Secondary Blue — Tech, innovation */
  --p1l-secondary: #4A90D9;         /* Sky blue */
  --p1l-secondary-light: #6BA8E8;   /* Light sky blue */
}
```

### Neutral Colors
```css
:root {
  /* Backgrounds */
  --p1l-bg-white: #FFFFFF;
  --p1l-bg-light: #F7F9FC;          /* Off-white with blue tint */
  --p1l-bg-section: #EDF2F7;        /* Section backgrounds */
  
  /* Text */
  --p1l-text-primary: #1A202C;      /* Near black */
  --p1l-text-secondary: #4A5568;    /* Dark gray */
  --p1l-text-muted: #718096;        /* Medium gray */
  --p1l-text-light: #A0AEC0;        /* Light gray */
  
  /* Borders */
  --p1l-border-light: #E2E8F0;
  --p1l-border-medium: #CBD5E0;
}
```

### Semantic Colors
```css
:root {
  --p1l-success: #38A169;           /* Green — approvals, positive */
  --p1l-warning: #D69E2E;           /* Amber — attention needed */
  --p1l-error: #E53E3E;             /* Red — errors, alerts */
  --p1l-info: #4A90D9;              /* Blue — informational */
}
```

### Gradient
```css
:root {
  /* Hero gradient */
  --p1l-gradient-hero: linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 50%, #4A90D9 100%);
  
  /* CTA button gradient */
  --p1l-gradient-cta: linear-gradient(135deg, #E8632B 0%, #F07D4A 100%);
  
  /* Subtle background gradient */
  --p1l-gradient-subtle: linear-gradient(180deg, #F7F9FC 0%, #FFFFFF 100%);
}
```

---

## Typography

### Font Stack
```css
:root {
  /* Headlines — Modern, authoritative */
  --p1l-font-heading: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
  
  /* Body text — Clean, readable */
  --p1l-font-body: 'Open Sans', 'Segoe UI', system-ui, sans-serif;
  
  /* Numbers/Data — Tabular, precise */
  --p1l-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale
```css
:root {
  --p1l-text-xs: 0.75rem;      /* 12px */
  --p1l-text-sm: 0.875rem;     /* 14px */
  --p1l-text-base: 1rem;       /* 16px */
  --p1l-text-lg: 1.125rem;     /* 18px */
  --p1l-text-xl: 1.25rem;      /* 20px */
  --p1l-text-2xl: 1.5rem;      /* 24px */
  --p1l-text-3xl: 1.875rem;    /* 30px */
  --p1l-text-4xl: 2.25rem;     /* 36px */
  --p1l-text-5xl: 3rem;        /* 48px */
  --p1l-text-6xl: 3.75rem;     /* 60px */
}
```

### Font Weights
```css
:root {
  --p1l-font-normal: 400;
  --p1l-font-medium: 500;
  --p1l-font-semibold: 600;
  --p1l-font-bold: 700;
}
```

### Line Heights
```css
:root {
  --p1l-leading-tight: 1.25;
  --p1l-leading-snug: 1.375;
  --p1l-leading-normal: 1.5;
  --p1l-leading-relaxed: 1.625;
  --p1l-leading-loose: 2;
}
```

---

## Spacing System

```css
:root {
  --p1l-space-1: 0.25rem;      /* 4px */
  --p1l-space-2: 0.5rem;       /* 8px */
  --p1l-space-3: 0.75rem;      /* 12px */
  --p1l-space-4: 1rem;         /* 16px */
  --p1l-space-5: 1.25rem;      /* 20px */
  --p1l-space-6: 1.5rem;       /* 24px */
  --p1l-space-8: 2rem;         /* 32px */
  --p1l-space-10: 2.5rem;      /* 40px */
  --p1l-space-12: 3rem;        /* 48px */
  --p1l-space-16: 4rem;        /* 64px */
  --p1l-space-20: 5rem;        /* 80px */
  --p1l-space-24: 6rem;        /* 96px */
}
```

---

## Border Radius

```css
:root {
  --p1l-radius-sm: 0.25rem;    /* 4px — inputs, small elements */
  --p1l-radius-md: 0.5rem;     /* 8px — cards, buttons */
  --p1l-radius-lg: 0.75rem;    /* 12px — modals, larger cards */
  --p1l-radius-xl: 1rem;       /* 16px — hero sections */
  --p1l-radius-2xl: 1.5rem;    /* 24px — feature cards */
  --p1l-radius-full: 9999px;   /* Pills, avatars */
}
```

---

## Shadows

```css
:root {
  --p1l-shadow-sm: 0 1px 2px 0 rgba(30, 58, 95, 0.05);
  --p1l-shadow-md: 0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06);
  --p1l-shadow-lg: 0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05);
  --p1l-shadow-xl: 0 20px 25px -5px rgba(30, 58, 95, 0.1), 0 10px 10px -5px rgba(30, 58, 95, 0.04);
  --p1l-shadow-2xl: 0 25px 50px -12px rgba(30, 58, 95, 0.25);
  
  /* Colored shadows for CTAs */
  --p1l-shadow-cta: 0 4px 14px 0 rgba(232, 99, 43, 0.35);
}
```

---

## Component Patterns

### Buttons

```css
/* Primary CTA Button */
.btn-primary {
  background: var(--p1l-gradient-cta);
  color: white;
  font-family: var(--p1l-font-heading);
  font-weight: var(--p1l-font-semibold);
  font-size: var(--p1l-text-base);
  padding: var(--p1l-space-3) var(--p1l-space-6);
  border-radius: var(--p1l-radius-md);
  box-shadow: var(--p1l-shadow-cta);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(232, 99, 43, 0.45);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--p1l-primary);
  border: 2px solid var(--p1l-primary);
  font-family: var(--p1l-font-heading);
  font-weight: var(--p1l-font-semibold);
  padding: var(--p1l-space-3) var(--p1l-space-6);
  border-radius: var(--p1l-radius-md);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--p1l-primary);
  color: white;
}
```

### Cards

```css
.card {
  background: var(--p1l-bg-white);
  border-radius: var(--p1l-radius-lg);
  box-shadow: var(--p1l-shadow-md);
  padding: var(--p1l-space-6);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: var(--p1l-shadow-xl);
  transform: translateY(-4px);
}

/* Feature card with icon */
.feature-card {
  text-align: center;
  padding: var(--p1l-space-8);
}

.feature-card .icon {
  width: 64px;
  height: 64px;
  background: var(--p1l-bg-section);
  border-radius: var(--p1l-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--p1l-space-4);
  color: var(--p1l-primary);
}
```

### Form Inputs

```css
.input {
  font-family: var(--p1l-font-body);
  font-size: var(--p1l-text-base);
  padding: var(--p1l-space-3) var(--p1l-space-4);
  border: 1px solid var(--p1l-border-medium);
  border-radius: var(--p1l-radius-sm);
  background: var(--p1l-bg-white);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--p1l-secondary);
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.input::placeholder {
  color: var(--p1l-text-light);
}

.label {
  font-family: var(--p1l-font-body);
  font-size: var(--p1l-text-sm);
  font-weight: var(--p1l-font-medium);
  color: var(--p1l-text-secondary);
  margin-bottom: var(--p1l-space-2);
  display: block;
}
```

### Navigation

```css
.nav {
  background: var(--p1l-bg-white);
  box-shadow: var(--p1l-shadow-sm);
  padding: var(--p1l-space-4) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-link {
  font-family: var(--p1l-font-heading);
  font-size: var(--p1l-text-sm);
  font-weight: var(--p1l-font-medium);
  color: var(--p1l-text-secondary);
  text-decoration: none;
  padding: var(--p1l-space-2) var(--p1l-space-4);
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--p1l-primary);
}
```

---

## Layout Guidelines

### Container Widths
```css
:root {
  --p1l-container-sm: 640px;
  --p1l-container-md: 768px;
  --p1l-container-lg: 1024px;
  --p1l-container-xl: 1280px;
  --p1l-container-2xl: 1440px;
}

.container {
  width: 100%;
  max-width: var(--p1l-container-xl);
  margin: 0 auto;
  padding: 0 var(--p1l-space-4);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--p1l-space-6);
  }
}
```

### Section Spacing
```css
.section {
  padding: var(--p1l-space-16) 0;
}

@media (min-width: 768px) {
  .section {
    padding: var(--p1l-space-20) 0;
  }
}

@media (min-width: 1024px) {
  .section {
    padding: var(--p1l-space-24) 0;
  }
}
```

---

## Voice & Tone

### Writing Style
- **Confident but not arrogant**: "We'll help you choose" not "We're the best"
- **Clear and direct**: Avoid jargon; explain mortgage terms simply
- **Action-oriented**: Use strong verbs — "Get Started", "Lock In", "Close Faster"
- **Personal**: Use "you" and "your" frequently; "we make YOU our #1 priority"
- **Benefit-focused**: Lead with what the customer gains

### Headlines
- Short, punchy, action-driven
- Often include numbers: "6 Ways We Help You Lock in Lower Rates"
- Emphasize speed and ease: "Close in as little as 8 days!"

### Body Copy
- Conversational but professional
- Break complex info into digestible chunks
- Use bullet points for features/benefits
- Always include clear CTAs

### Sample Copy Patterns
```
Hero: "Close your home loan in as little as 8 days!"
Subhead: "We provide our clients a superior mortgage process by utilizing our platform which eliminates the complexity..."
CTA: "GET STARTED NOW"
Feature Title: "ADVANCED TECHNOLOGY"
Feature Description: "With our top-of-the-line technology, we provide our clients a superior mortgage process..."
```

---

## Iconography

### Style Guidelines
- Line icons preferred (2px stroke)
- Rounded caps and joins
- Consistent 24x24px base size
- Color: `var(--p1l-primary)` or `var(--p1l-accent)` for emphasis

### Recommended Icon Sets
- Heroicons (MIT License)
- Lucide Icons
- Phosphor Icons

### Common Icons Needed
- Home / House
- Calculator
- Document / File
- Shield / Security
- Clock / Speed
- User / Person
- Phone / Contact
- Check / Checkmark
- Arrow / Chevron
- Dollar / Money

---

## Image Guidelines

### Photography Style
- Diverse, authentic homeowners and families
- Warm, natural lighting
- Modern home interiors and exteriors
- Professional but approachable team photos
- Avoid overly staged stock photos

### Image Treatment
```css
.img-rounded {
  border-radius: var(--p1l-radius-lg);
}

.img-shadow {
  box-shadow: var(--p1l-shadow-lg);
}

/* Hero image overlay */
.hero-overlay {
  background: linear-gradient(
    135deg,
    rgba(30, 58, 95, 0.85) 0%,
    rgba(45, 90, 138, 0.75) 100%
  );
}
```

---

## Animations & Transitions

### Timing Functions
```css
:root {
  --p1l-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --p1l-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --p1l-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --p1l-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Duration Scale
```css
:root {
  --p1l-duration-fast: 150ms;
  --p1l-duration-normal: 200ms;
  --p1l-duration-slow: 300ms;
  --p1l-duration-slower: 500ms;
}
```

### Common Animations
```css
/* Fade in up (for scroll reveals) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp var(--p1l-duration-slow) var(--p1l-ease-out);
}

/* Pulse (for CTAs) */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.animate-pulse {
  animation: pulse 2s var(--p1l-ease-default) infinite;
}
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */
:root {
  --p1l-breakpoint-sm: 640px;   /* Small tablets */
  --p1l-breakpoint-md: 768px;   /* Tablets */
  --p1l-breakpoint-lg: 1024px;  /* Small desktops */
  --p1l-breakpoint-xl: 1280px;  /* Desktops */
  --p1l-breakpoint-2xl: 1536px; /* Large desktops */
}

/* Usage */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## Accessibility Requirements

### Color Contrast
- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements must have visible focus states
- Don't rely on color alone to convey information

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--p1l-secondary);
  outline-offset: 2px;
}

/* For buttons */
.btn:focus-visible {
  outline: 2px solid var(--p1l-primary);
  outline-offset: 2px;
  box-shadow: var(--p1l-shadow-lg);
}
```

### Semantic HTML
- Use proper heading hierarchy (h1 → h6)
- Form inputs must have associated labels
- Images must have alt text
- Use ARIA labels where appropriate

---

## Code Conventions

### CSS Class Naming
Use BEM-inspired naming:
```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier */
.card--featured { }
.card--compact { }
```

### File Organization
```
styles/
├── variables.css     /* All CSS custom properties */
├── base.css          /* Reset, typography, globals */
├── components/
│   ├── buttons.css
│   ├── cards.css
│   ├── forms.css
│   └── nav.css
├── layouts/
│   ├── header.css
│   ├── footer.css
│   └── sections.css
└── utilities.css     /* Helper classes */
```

---

## Tailwind Configuration (if using Tailwind CSS)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'p1l': {
          'primary': '#1E3A5F',
          'primary-light': '#2D5A8A',
          'primary-dark': '#0F1F33',
          'accent': '#E8632B',
          'accent-light': '#F07D4A',
          'accent-dark': '#C54D1A',
          'secondary': '#4A90D9',
          'secondary-light': '#6BA8E8',
        }
      },
      fontFamily: {
        'heading': ['Montserrat', 'system-ui', 'sans-serif'],
        'body': ['Open Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'p1l': '0.5rem',
      },
      boxShadow: {
        'p1l': '0 4px 6px -1px rgba(30, 58, 95, 0.1)',
        'p1l-lg': '0 10px 15px -3px rgba(30, 58, 95, 0.1)',
        'p1l-cta': '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
      }
    }
  }
}
```

---

## Quick Reference

| Element | Primary Style |
|---------|---------------|
| Primary CTA | Orange gradient, white text, uppercase |
| Secondary CTA | Navy outline, navy text |
| Headlines | Montserrat, Bold/Semibold |
| Body Text | Open Sans, Regular |
| Cards | White bg, rounded corners, subtle shadow |
| Links | Navy blue, underline on hover |
| Section BG | Alternating white / light gray-blue |

---

## Contact & Resources

- **Website**: https://priority1lending.com
- **Phone**: (734) 720-8700
- **Email**: info@priority1lending.com
- **NMLS#**: 1375378

---

*Last Updated: November 2025*
*For internal development use only*
