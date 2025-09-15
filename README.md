# Softsocial - A Gentle Social Media MVP

A mindful social media platform built with Next.js, Supabase, and shadcn/ui components, focusing on kindness and meaningful connections.

## 🌸 Features

- **Mindful Design**: Soft, gentle UI with soothing colors and smooth animations
- **Secure Authentication**: User signup/login with Supabase Auth
- **Social Interactions**:
  - Create and share posts (up to 500 characters)
  - Like and comment on posts
  - Follow/unfollow other users
  - View user profiles with stats
- **Real-time Updates**: Automatic feed refresh and live interactions
- **Responsive Design**: Works beautifully on desktop and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone and navigate to the project:

   ```bash
   git clone <repository>
   cd my-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.local` or create it with your Supabase credentials
   - The database schema is already configured

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 How to Use

### First Time Setup

1. **Visit the Landing Page**: Go to `http://localhost:3000` to see the beautiful landing page
2. **Sign Up**: Click "Get Started" or "Sign up" to create your account
   - Choose a unique username (3-25 characters, alphanumeric + underscore)
   - Provide your full name and email
   - Create a secure password (6+ characters)
3. **Verify Email**: Check your email for the confirmation link (if email is configured)
4. **Sign In**: After verification, sign in with your credentials

### Using the Platform

1. **Main Feed** (`/feed`):

   - Create your first post using the compose box at the top
   - View posts from all users in chronological order
   - Like posts by clicking the heart icon
   - Click refresh to see new posts

2. **User Profiles** (`/profile/username`):

   - Click on any username or avatar to view their profile
   - See user stats (posts, followers, following)
   - Follow/unfollow users (you can't follow yourself)
   - View all posts by that user

3. **Navigation**:
   - Use the top navigation to move between sections
   - Click your avatar to access profile and settings
   - Mobile-friendly bottom navigation on smaller screens

## 🏗️ Database Schema

The application uses these main tables:

- **profiles**: User information (extends auth.users)
- **posts**: User posts with content and metadata
- **likes**: Post likes relationship
- **follows**: User follow relationships
- **comments**: Post comments (table created, functionality can be extended)

## 🎨 Design Philosophy

Softsocial emphasizes:

- **Gentle Aesthetics**: Soft gradients, rounded corners, subtle shadows
- **Mindful Interactions**: Positive-only reactions, thoughtful prompts
- **Calm Colors**: Pink, purple, and indigo gradients with white/gray base
- **Smooth Animations**: Gentle hover effects and transitions
- **Clean Typography**: Easy-to-read fonts with good spacing

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: TailwindCSS with custom gradients
- **UI Components**: shadcn/ui (Radix-based)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time capabilities
- **Date Handling**: date-fns for formatting

## 🔧 Development

### Key Components

- `Navigation`: Top/mobile navigation with user menu
- `PostCard`: Individual post display with interactions
- `CreatePost`: Post composition with character counter
- `Landing Page`: Beautiful marketing homepage

### Database Functions

- `get_posts_with_stats()`: Retrieves posts with engagement metrics
- `handle_new_user()`: Auto-creates profile on signup
- Row Level Security (RLS) policies for secure data access

## 📱 Responsive Design

- Desktop: Full sidebar navigation and wide layout
- Tablet: Adapted spacing and navigation
- Mobile: Bottom navigation bar and optimized touch targets

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- User authentication required for protected routes
- Secure API calls with user context
- Input validation and sanitization

## 🚀 Future Enhancements

Consider adding:

- Image uploads for posts and avatars
- Comments functionality (database ready)
- Real-time notifications
- Search and discovery features
- Dark mode toggle
- Advanced privacy settings
- Content moderation tools

## 🐛 Troubleshooting

### Common Issues

1. **Can't sign up**: Check if email service is configured in Supabase
2. **Database errors**: Verify Supabase connection and RLS policies
3. **Build errors**: Ensure all dependencies are installed
4. **Styling issues**: Check TailwindCSS configuration

### Support

- Check the browser console for error messages
- Verify Supabase connection in the network tab
- Ensure environment variables are properly set

## 📄 License

This project is a MVP demonstration. Use it as a starting point for your own social media platform.

---

**Built with 💜 for meaningful connections**
