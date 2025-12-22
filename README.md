# Jewel AI CRM

A modern CRM system with Admin and Sales Person panels built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Sign-in Only Authentication** - No signup page, streamlined login experience
- **Admin Panel** - Full system control with clients, followups, reports, and settings
- **Sales Panel** - Sales-focused dashboard with leads, followups, and performance tracking
- **Blur Effect UI** - Modern purple/blue gradient blur background theme
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Static Content** - Ready for backend integration

## Tech Stack

- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 3.4.11** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Router** - Navigation
- **Sonner** - Toast notifications

## Project Structure

```
src/
├── components/
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   └── SalesLayout.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   ├── SalesDashboard.tsx
│   ├── admin/
│   │   ├── Home.tsx
│   │   ├── Clients.tsx
│   │   ├── Followups.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   └── sales/
│       ├── Home.tsx
│       ├── Leads.tsx
│       └── Followups.tsx
├── lib/
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Getting Started

### Installation

```bash
cd jewel-ai-crm
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Demo Credentials

- **Email**: any@email.com
- **Password**: any password
- **Roles**: Admin or Sales Person

## Features Overview

### Admin Panel
- Dashboard with key metrics and charts
- Client management
- Followup tracking
- Performance reports
- System settings

### Sales Panel
- Personal dashboard with sales metrics
- Lead management
- Followup tracking
- Performance analytics

## Customization

### Colors
The app uses a purple/blue gradient theme with blur effects. Customize in:
- `tailwind.config.ts` - Color definitions
- `src/index.css` - Blur effect styles

### Navigation
Update menu items in:
- `src/components/layouts/AdminLayout.tsx`
- `src/components/layouts/SalesLayout.tsx`

## Next Steps

1. Connect to backend API
2. Implement real authentication
3. Add database integration
4. Implement real data fetching
5. Add more features as needed

## License

MIT
