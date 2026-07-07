import { Redirect } from 'expo-router';

import { useProfile } from '@/context/profile-context';

// Entry point for onboarding: send the user to whichever step they still need.
// New sign-ups go personalize → notification-preferences; users from before the
// personalization feature only see the personalize step.
export default function OnboardingIndex() {
  const { profile } = useProfile();
  const needsPersonalization = !profile || !profile.interests || profile.interests.length === 0;
  return (
    <Redirect
      href={needsPersonalization ? '/onboarding/personalize' : '/onboarding/notification-preferences'}
    />
  );
}
