import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/context/profile-context";
import { supabase } from "@/lib/supabase";

export function useAvatarUpload() {
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    if (!user?.id) return;
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required to set a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const extension = asset.mimeType?.split("/")[1] ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }, [user?.id, refreshProfile]);

  return { uploading, error, pickAndUpload };
}
