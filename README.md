# Thermal Scan App

## Overview
The Thermal Scan App is a web application that simulates a thermal scanning experience. Users can start a thermal scan, view a scanning animation, and receive results indicating whether they are "cool" or "hot." The application utilizes React and TypeScript, leveraging Next.js for routing and component management.

## Features
- **Start Screen**: An initial screen with a button to begin the thermal scanning process.
- **Thermal Scanning**: A dedicated scanning section that displays a scanning animation and a meter indicating the scanning progress.
- **Results Screen**: After a brief delay, users receive feedback based on the thermal scan results, with messages indicating their thermal status.

## Project Structure
```
thermal-scan-app
├── src
│   ├── components
│   │   ├── StartScreen.tsx
│   │   ├── ThermalScanner.tsx
│   │   ├── ScanningAnimation.tsx
│   │   ├── Meter.tsx
│   │   ├── ResultScreen.tsx
│   │   └── thermal-camera.tsx
│   ├── pages
│   │   ├── index.tsx
│   │   └── scan.tsx
│   ├── styles
│   │   └── globals.css
│   └── types
│       └── index.ts
├── public
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd thermal-scan-app
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
1. Start the development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000` to view the application.

## Technologies Used
- React
- TypeScript
- Next.js
- CSS for styling

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.