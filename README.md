# UTM Leads Tracker

A modern Next.js web application for tracking UTM campaigns, leads, and earnings in real-time. The application integrates with Google Sheets to provide live data updates and a beautiful, professional user interface.

## 🚀 Features

- **User Authentication**: Secure login system with username/password
- **User Registration**: Complete registration form with all required fields
- **Real-time Data**: Live updates from Google Sheets
- **UTM Tracking**: Monitor your UTM campaign performance
- **Lead Analytics**: Track leads, conversions, and earnings
- **Professional UI**: Beautiful, responsive design with Tailwind CSS
- **Auto-refresh**: Data updates automatically on page refresh

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Authentication**: Context-based state management
- **API Integration**: Google Sheets API v4

## 📊 Data Sources

### Users Sheet
- **ID**: `1wjlhARQyUFwuBr4gLnPHchTlvrE2ub9eslXzd_yAUpA`
- **Data**: Username, Password, UTM ID

### UTM Leads Sheet
- **ID**: `1HMROFgEXlyPU5gXCl60B3fAC0D3sR_uW5OD7srGf-Ig`
- **Data**: UTM IDs, Lead counts, Conversion rates
- **Rate**: ₹45 per lead

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Sheets API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd utm-leads-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Google Sheets API**
   - Ensure Google Sheets API is enabled in your Google Cloud Console
   - Verify the API key has access to both sheets

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Pages & Routes

- **`/`** - Home page (redirects to login/dashboard)
- **`/login`** - User authentication
- **`/register`** - User registration
- **`/dashboard`** - Main dashboard (protected route)

## 🔐 Authentication

The application uses a context-based authentication system:
- Users can register with name, email, social media link, and mobile number
- Login requires username and password
- Authentication state persists across page refreshes
- Protected routes automatically redirect unauthenticated users

## 📈 Dashboard Features

### Overview Stats
- Total Leads
- Total Disbursals
- Conversion Rate
- Daily Average

### User Performance
- Personal UTM ID
- Leads generated
- Total earnings
- Rate per lead

### All Campaigns
- Complete list of UTM campaigns
- Lead counts and earnings
- Highlighted user row
- Real-time data updates

## 🔄 Data Refresh

- **Automatic**: Data loads on dashboard entry
- **Manual**: Refresh button for immediate updates
- **Real-time**: Google Sheets integration ensures latest data

## 🎨 UI Components

### Forms
- **Login Form**: Clean, professional design with validation
- **Registration Form**: Comprehensive fields with real-time validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Smooth loading animations

### Dashboard
- **Responsive Grid**: Adapts to all screen sizes
- **Card Layout**: Clean, organized information display
- **Interactive Elements**: Hover effects and smooth transitions
- **Professional Icons**: Lucide React icons for consistency

## 🔧 Configuration

### Environment Variables
The application uses the Google Sheets API key directly in the code. For production, consider:
- Moving API keys to environment variables
- Implementing proper API key rotation
- Adding rate limiting and error handling

### Google Sheets Setup
1. Ensure both sheets are publicly accessible
2. Verify API key permissions
3. Check sheet structure matches expected format

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Considerations
- Set `NODE_ENV=production`
- Configure proper CORS settings
- Implement proper error logging
- Add monitoring and analytics

## 🔒 Security Features

- **Protected Routes**: Authentication-required pages
- **Input Validation**: Form validation and sanitization
- **Secure Storage**: Local storage for user sessions
- **API Security**: Google Sheets API integration

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts
- **Desktop Experience**: Full-featured dashboard
- **Cross-browser**: Modern browser compatibility

## 🎯 Future Enhancements

- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Charts and graphs
- **User Management**: Admin panel for user management
- **Export Features**: Data export to CSV/Excel
- **Notifications**: Real-time alerts and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code structure
- Contact the development team

---

**Built with ❤️ using Next.js and Tailwind CSS**
xdfghjhgfxdzsdfghjkhg