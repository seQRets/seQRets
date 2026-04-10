import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { UpdateChecker } from '@/components/update-checker';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import SupportPage from '@/pages/SupportPage';
import SmartCardPage from '@/pages/SmartCardPage';
import InstructionsPage from '@/pages/InstructionsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import ContactPage from '@/pages/ContactPage';
import { maybeFireLaunchNotification } from '@/lib/review-reminder';

export default function App() {
  useEffect(() => {
    // Fire the OS notification once per session if a review is overdue
    // and the user has opted into notifications on this machine.
    void maybeFireLaunchNotification();
  }, []);

  return (
    <ThemeProvider defaultTheme="system">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/smartcard" element={<SmartCardPage />} />
        <Route path="/inheritance" element={<InstructionsPage />} />
      </Routes>
      <UpdateChecker checkOnMount />
      <Toaster />
    </ThemeProvider>
  );
}
