# Khajjidoni Premier League - John Deere Branding Guide

## Season 2 Sponsor: John Deere

### Branding Implementation

This document outlines how John Deere branding has been integrated throughout the Khajjidoni Premier League application.

---

## 1. Branding Configuration

**File:** `src/config/branding.js`

Contains centralized branding configuration:
- League Name: Khajjidoni Premier League
- Season: Season 2
- Year: 2026
- Season Sponsor: John Deere
- Sponsor Colors: Green (#367C2B) and Gold (#FFD700)

### Usage:
```javascript
import { BRANDING, getSeasonTitle, getSponsorBranding } from '../config/branding';

// Get season title
const title = getSeasonTitle(); // "Khajjidoni Premier League - Season 2 2026"

// Get sponsor branding
const sponsorText = getSponsorBranding(); // "Season 2 Powered by John Deere"
```

---

## 2. Home Page Branding

### Header Section
- **Sponsor Badge** at the top with John Deere branding
- Green gradient background with gold border
- Tractor emoji (🌾) for visual identity
- Text: "Season 2 Powered by John Deere"

### Footer Section
- **League Information** column with league name and season details
- **Sponsor Section** (center) featuring:
  - "SEASON SPONSOR" label
  - John Deere name with tractor emojis
  - "Proudly Powered by John Deere" tagline
- **Quick Links** column for navigation
- **Copyright** with sponsor branding

---

## 3. Auction Page Branding

### Header Section
- **Sponsor Badge** below the main title
- Green background with yellow border
- Consistent with home page design
- Text: "Powered by John Deere"

---

## 4. Visual Design Elements

### Colors
- **Primary Sponsor Color:** John Deere Green (#367C2B)
- **Accent Color:** Gold (#FFD700)
- **Background:** Dark gray/black for contrast

### Icons & Symbols
- **Tractor Emoji:** 🌾 (used throughout for John Deere identity)
- **Trophy Icon:** 🏆 (for league branding)

### Typography
- **Bold Font:** Used for sponsor name
- **Uppercase:** "SEASON SPONSOR" label
- **Consistent Sizing:** Responsive across all devices

---

## 5. Implementation Across Pages

### Currently Implemented:
1. ✅ **Home Page** - Header badge + Footer branding
2. ✅ **Auction Page** - Header badge

### To Be Implemented:
- [ ] Teams Page - Add sponsor badge
- [ ] Stats Page - Add sponsor badge
- [ ] News Page - Add sponsor badge
- [ ] Player Registration - Add sponsor badge
- [ ] Admin Panel - Add sponsor branding

---

## 6. Mobile Responsiveness

All sponsor branding elements are fully responsive:
- **Mobile:** Compact badge with essential information
- **Tablet:** Medium-sized badges with full text
- **Desktop:** Full-featured sponsor sections with additional details

---

## 7. Sponsor Branding Guidelines

### Do's:
✅ Always include John Deere name with sponsor badge
✅ Use green and gold colors consistently
✅ Include tractor emoji for visual identity
✅ Place sponsor badge prominently on each page
✅ Use "Powered by John Deere" tagline

### Don'ts:
❌ Don't modify sponsor colors without approval
❌ Don't remove sponsor branding from pages
❌ Don't use different sponsor names
❌ Don't place sponsor badge in hidden areas

---

## 8. Future Enhancements

- Add actual John Deere logo (when available)
- Create sponsor-specific landing page
- Add sponsor testimonials/quotes
- Implement sponsor-specific analytics
- Create sponsor merchandise section

---

## 9. Contact & Support

For branding-related questions or updates:
- Email: info@khajjidoni.com
- Sponsor: John Deere

---

**Last Updated:** February 2026
**Version:** 1.0
