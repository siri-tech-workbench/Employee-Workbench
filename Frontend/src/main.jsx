import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./utils/login.theme";
import ErrorBoundary from "./Components/ErrorBoundary.jsx";

// Mount the root React application into the #root DOM element.
// All providers are wrapped here so they are available throughout the entire app.
createRoot(document.getElementById("root")).render(
  // StrictMode enables additional runtime warnings during development
  <StrictMode>
    {/* HashRouter uses the URL hash for client-side routing,
        which avoids server-side route configuration requirements */}
    <HashRouter>
      {/* ThemeProvider applies the custom MUI theme globally */}
      <ThemeProvider theme={theme}>
        {/* CssBaseline normalizes browser default styles to match MUI conventions */}
        <CssBaseline />

        {/* ErrorBoundary catches unhandled React errors and renders a fallback UI */}
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
