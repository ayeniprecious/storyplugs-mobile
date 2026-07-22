import { MaterialCommunityIcons } from '@expo/vector-icons';

// The official account and every premium user get this next to their name --
// same scalloped-circle-with-checkmark shape as Twitter/Meta/Instagram's
// verified badge, just in brand red instead of blue.
export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return <MaterialCommunityIcons name="check-decagram" size={size} color="#C01918" />;
}
