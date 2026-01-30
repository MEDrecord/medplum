# MEDrecord Brand Guidelines

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Approved

## Brand Overview

MEDrecord is the essential platform that simplifies and accelerates the creation of secure, compliant eHealth applications. We leverage advanced AI and Agentic frameworks, ensuring innovative solutions meet the highest standards and reach patients faster.

### Brand Ecosystem

| Brand | Focus | Logo |
|-------|-------|------|
| **MEDrecord** | Parent platform - eHealth Platform as a Service | Gear with heartbeat |
| **MedSafe** | Security & compliance focus | Shield with cross |
| **Coachi** | Patient coaching & engagement | TBD |
| **HealthTalk** | Communication & messaging | TBD |

---

## Brand Identity

### Brand Archetype: The Creator

> "Think different."

MEDrecord embodies 'The Creator' archetype by enabling healthcare and tech companies to build secure, compliant, and effective eHealth applications. We provide the foundational AI and Agentic framework that accelerates innovation.

### Brand Voice

- **Professional** - Clear, authoritative communication
- **Confident** - Direct statements without hedging
- **Empowering** - Enabling others to create
- **Innovative** - Forward-thinking language
- **Human-centric** - Avoiding unnecessary jargon

### Brand Promise

We promise to make building secure, compliant, and effective eHealth applications easier and faster. This lets you bring your innovations to patients with confidence.

### Brand Personality

- **Innovative** - Pushing boundaries in eHealth
- **Trustworthy** - Security and compliance first
- **Empowering** - Enabling creators to build
- **Intelligent** - AI-driven solutions
- **Pioneering** - Leading the industry forward

### Brand Values

1. **Trustworthiness** - Security, compliance, and reliability at the core
2. **Visionary** - Shaping the future of healthcare technology

---

## Visual Identity

### Color Palette

#### Primary Colors

| Color | Name | Hex | HSL | Usage |
|-------|------|-----|-----|-------|
| ![#2C5F9B](https://via.placeholder.com/20/2C5F9B/2C5F9B) | Deep Trust Blue | `#2C5F9B` | `212 56% 39%` | Primary brand color, headers, CTAs |
| ![#E8A838](https://via.placeholder.com/20/E8A838/E8A838) | Golden Amber | `#E8A838` | `40 80% 56%` | Accents, highlights, energy |

#### Secondary Colors

| Color | Name | Hex | HSL | Usage |
|-------|------|-----|-----|-------|
| ![#5DADE2](https://via.placeholder.com/20/5DADE2/5DADE2) | Clear Sky Blue | `#5DADE2` | `197 67% 63%` | Innovation, links, interactive |
| ![#4A9C8D](https://via.placeholder.com/20/4A9C8D/4A9C8D) | Vital Teal | `#4A9C8D` | `168 36% 45%` | Health, wellness, success |
| ![#6C757D](https://via.placeholder.com/20/6C757D/6C757D) | Professional Gray | `#6C757D` | `210 7% 46%` | Text, borders, neutral |

#### Neutral Colors

| Color | Name | Hex | HSL | Usage |
|-------|------|-----|-----|-------|
| ![#1A2332](https://via.placeholder.com/20/1A2332/1A2332) | Dark Navy | `#1A2332` | `217 31% 15%` | Dark backgrounds, text |
| ![#F8FAFC](https://via.placeholder.com/20/F8FAFC/F8FAFC) | Cloud White | `#F8FAFC` | `210 40% 98%` | Light backgrounds |
| ![#E2E8F0](https://via.placeholder.com/20/E2E8F0/E2E8F0) | Soft Gray | `#E2E8F0` | `214 32% 91%` | Borders, dividers |

#### Psychological Associations

- **Deep Trust Blue**: Trust, reliability, stability, professionalism, authority, security
- **Golden Amber**: Energy, optimism, creativity, warmth, innovation
- **Vital Teal**: Health, renewal, sophistication, balance, well-being
- **Clear Sky Blue**: Clarity, innovation, openness, calm, accessibility

### Typography

#### Primary Font: IBM Plex Sans

Modern sans-serif that projects intelligence, innovation, and a pioneering spirit. Clear, robust design conveys trustworthiness and professionalism.

```css
font-family: 'IBM Plex Sans', system-ui, sans-serif;
```

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48px | 700 | 1.2 |
| H2 | 36px | 600 | 1.25 |
| H3 | 24px | 600 | 1.3 |
| H4 | 20px | 500 | 1.4 |
| Body Large | 18px | 400 | 1.6 |
| Body | 16px | 400 | 1.6 |
| Small | 14px | 400 | 1.5 |

#### Secondary Font: Inter

Highly legible on digital screens, excellent for body text. Clean, neutral design supports trustworthy and reliable values.

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Logo Assets

#### MEDrecord Logo

- **Full Logo**: Gear with heartbeat + "MEDrecord" wordmark
- **Tagline**: "eHealth platform as a Service"
- **Icon Only**: Gear with heartbeat (for favicons, app icons)

#### MedSafe Logo

- **Shield Icon**: Teal border, golden inner edge, white center, gold cross
- **Usage**: Security-focused content, compliance badges, trust indicators

#### Logo Clear Space

Maintain minimum clear space equal to the height of the "M" in MEDrecord around all logo variants.

#### Logo Don'ts

- Do not stretch or distort
- Do not change colors outside brand palette
- Do not add effects (shadows, gradients)
- Do not place on busy backgrounds without contrast

---

## Design Tokens (CSS)

### Implementation in Tailwind CSS v4

```css
@theme inline {
  /* Primary Colors */
  --color-primary: #2C5F9B;
  --color-primary-foreground: #FFFFFF;
  --color-accent: #E8A838;
  --color-accent-foreground: #1A2332;
  
  /* Secondary Colors */
  --color-sky: #5DADE2;
  --color-teal: #4A9C8D;
  --color-gray: #6C757D;
  
  /* Neutrals */
  --color-background: #FFFFFF;
  --color-foreground: #1A2332;
  --color-muted: #F8FAFC;
  --color-muted-foreground: #6C757D;
  --color-border: #E2E8F0;
  
  /* Semantic */
  --color-success: #4A9C8D;
  --color-warning: #E8A838;
  --color-error: #DC2626;
  
  /* Typography */
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  
  /* Spacing */
  --radius: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

---

## Component Patterns

### Buttons

#### Primary Button
- Background: Deep Trust Blue (`#2C5F9B`)
- Text: White
- Hover: Darken 10%
- Border Radius: 0.5rem

#### Secondary Button
- Background: Transparent
- Border: Deep Trust Blue
- Text: Deep Trust Blue
- Hover: Light blue background

#### Accent Button
- Background: Golden Amber (`#E8A838`)
- Text: Dark Navy
- Hover: Darken 10%
- Use sparingly for high-priority CTAs

### Cards

- Background: White
- Border: Soft Gray (`#E2E8F0`)
- Border Radius: 0.75rem
- Shadow: Subtle (`0 1px 3px rgba(0,0,0,0.1)`)
- Padding: 1.5rem

### Navigation

- Background: White or Dark Navy (dark mode)
- Active Link: Deep Trust Blue with underline
- Hover: Vital Teal

---

## Brand Messaging

### Taglines

- **Primary**: "eHealth platform as a Service"
- **Innovation**: "Accelerating secure eHealth innovation"
- **Trust**: "Build with confidence, deploy with trust"

### Key Messages

1. **For HealthTech Innovators**: "Focus on your vision, we handle compliance"
2. **For Healthcare Organizations**: "Secure, compliant, ready to scale"
3. **For Developers**: "From idea to production in record time"

### Elevator Pitch

> MEDrecord uses AI and Agentic frameworks to speed up how you build secure, compliant eHealth applications. We turn complex data challenges into smooth innovation.

---

## Application Examples

### Research Example Application

This researcher application demonstrates MEDrecord's capabilities:

- **Header**: MEDrecord logo with Deep Trust Blue navigation
- **Hero**: Bold headline with Golden Amber accent CTA
- **Features**: Card-based layout with Vital Teal icons
- **Footer**: Dark Navy background with trust badges

### Multi-Tenant Branding

Each tenant can customize:
- Logo placement
- Primary color (within brand guidelines)
- Custom subdomain

Core MEDrecord branding elements remain consistent:
- Typography
- Component patterns
- Footer attribution: "Powered by MEDrecord"

---

## File References

### Logo Files

| Asset | Path | Format |
|-------|------|--------|
| MEDrecord Full Logo | `/public/images/medrecord-logo.png` | PNG |
| MedSafe Shield | `/public/images/medsafe-shield.png` | PNG |
| Favicon | `/public/favicon.ico` | ICO |

### External URLs (Blob Storage)

```
MEDrecord Logo: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Made%20with%20love%20by%20medrecord-O8x7giogCTGnuUtIeBXdKfM77ceckY.png

MedSafe Shield: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-1024-transparent-sMXHQsKB9VxbAxLQ17TmJPrYOz6XtI.png
```

---

## Compliance & Legal

### Required Attributions

All applications built on MEDrecord must include:
- "Powered by MEDrecord" in footer
- Link to MEDrecord.io
- Privacy policy reference

### Trademark Usage

- MEDrecord is a registered trademark
- MedSafe, Coachi, HealthTalk are trademarks of MEDrecord
- Third-party use requires written permission

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | January 2026 | Initial brand guidelines |
