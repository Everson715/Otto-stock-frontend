import React, { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingHowItWorks } from '../components/landing/LandingHowItWorks';
import { LandingRoles } from '../components/landing/LandingRoles';
import { LandingCta } from '../components/landing/LandingCta';
import { LandingFooter } from '../components/landing/LandingFooter';

export function Landing() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Otto Stock — Gestão Clínica';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleAnchorClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      event.preventDefault();
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      window.history.replaceState(null, '', `#${targetId}`);
    },
    []
  );

  return (
    <div className="min-h-svh w-full flex flex-col bg-background text-on-surface font-sans overflow-x-hidden">
      <LandingHeader
        isAuthenticated={isAuthenticated}
        onAnchorClick={handleAnchorClick}
      />

      <main className="flex-1">
        <LandingHero
          isAuthenticated={isAuthenticated}
          onAnchorClick={handleAnchorClick}
        />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingRoles />
        <LandingCta isAuthenticated={isAuthenticated} />
      </main>

      <LandingFooter />
    </div>
  );
}

export default Landing;
