"use client";
import { Provider } from "react-redux";
import store from "../store/store"; // ✅ Correct
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {children}
        </Provider>
      </body>
    </html>
  );
}
